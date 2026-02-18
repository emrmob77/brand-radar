import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api/with-api-error-handling";
import { apiKeyPrefix, createPlainApiKey, hashApiKey } from "@/lib/api/api-key";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createApiKeySchema = z.object({
  name: z.string().trim().min(2).max(80)
});

async function authorizeAdmin() {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "Session not found." }, { status: 401 }) };
  }

  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "User not authenticated." }, { status: 401 }) };
  }

  if (currentUser.role !== "admin") {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "Admin role required." }, { status: 403 }) };
  }

  return {
    ok: true as const,
    accessToken,
    currentUser
  };
}

export async function GET() {
  return withApiErrorHandling(async () => {
    const auth = await authorizeAdmin();
    if (!auth.ok) {
      return auth.response;
    }

    const supabase = createServerSupabaseClient(auth.accessToken);
    const query = await supabase
      .from("api_keys")
      .select("id,name,key_prefix,last_used_at,revoked_at,created_at")
      .eq("agency_id", auth.currentUser.agencyId)
      .order("created_at", { ascending: false });

    if (query.error) {
      return NextResponse.json({ ok: false, error: query.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      keys: query.data ?? []
    });
  }, "api/v1/api-keys#get");
}

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const auth = await authorizeAdmin();
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const parsed = createApiKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const plainKey = createPlainApiKey();
    const keyHash = hashApiKey(plainKey);
    const prefix = apiKeyPrefix(plainKey);
    const supabase = createServerSupabaseClient(auth.accessToken);
    const insert = await supabase
      .from("api_keys")
      .insert({
        agency_id: auth.currentUser.agencyId,
        created_by: auth.currentUser.id,
        name: parsed.data.name,
        key_prefix: prefix,
        key_hash: keyHash
      })
      .select("id,name,key_prefix,created_at")
      .maybeSingle();

    if (insert.error || !insert.data) {
      return NextResponse.json({ ok: false, error: insert.error?.message ?? "Could not create API key." }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        key: insert.data,
        plainApiKey: plainKey
      },
      { status: 201 }
    );
  }, "api/v1/api-keys#post");
}
