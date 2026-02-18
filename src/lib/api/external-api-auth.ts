import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/api/rate-limit";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

export type ExternalApiContext = {
  agencyId: string;
  apiKeyId: string;
};

type AccessResult =
  | {
      ok: true;
      context: ExternalApiContext;
      headers: HeadersInit;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function getApiKeyFromRequest(request: NextRequest) {
  const fromHeader = request.headers.get("x-api-key");
  if (fromHeader) {
    return fromHeader.trim();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function unauthorized(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export async function requireExternalApiAccess(request: NextRequest): Promise<AccessResult> {
  const apiKey = getApiKeyFromRequest(request);
  if (!apiKey) {
    return {
      ok: false,
      response: unauthorized("Missing API key.")
    };
  }

  const keyHash = hashApiKey(apiKey);
  const supabase = createServiceRoleSupabaseClient();
  const keyResult = await supabase
    .from("api_keys")
    .select("id,agency_id,revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (keyResult.error || !keyResult.data || keyResult.data.revoked_at) {
    return {
      ok: false,
      response: unauthorized("Invalid API key.")
    };
  }

  const limitResult = consumeRateLimit(keyResult.data.id);
  if (!limitResult.allowed) {
    const response = NextResponse.json(
      {
        ok: false,
        error: "Rate limit exceeded."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limitResult.retryAfterSeconds),
          "X-RateLimit-Limit": String(limitResult.limit),
          "X-RateLimit-Remaining": String(limitResult.remaining)
        }
      }
    );

    return { ok: false, response };
  }

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyResult.data.id);

  return {
    ok: true,
    context: {
      agencyId: keyResult.data.agency_id,
      apiKeyId: keyResult.data.id
    },
    headers: {
      "X-RateLimit-Limit": String(limitResult.limit),
      "X-RateLimit-Remaining": String(limitResult.remaining)
    }
  };
}
