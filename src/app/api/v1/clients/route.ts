import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireExternalApiAccess } from "@/lib/api/external-api-auth";
import { withApiErrorHandling } from "@/lib/api/with-api-error-handling";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const clientCreateSchema = z.object({
  name: z.string().trim().min(2),
  domain: z.string().trim().min(3),
  industry: z.string().trim().min(2),
  activePlatforms: z.array(z.string().trim()).optional()
});

export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const limitValue = Number(request.nextUrl.searchParams.get("limit") ?? "50");
    const limit = Math.min(200, Math.max(1, Number.isNaN(limitValue) ? 50 : limitValue));
    const supabase = createServiceRoleSupabaseClient();
    const query = await supabase
      .from("clients")
      .select("id,name,domain,industry,logo_url,health_score,active_platforms,created_at,updated_at")
      .eq("agency_id", access.context.agencyId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query.error) {
      return NextResponse.json({ ok: false, error: query.error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        data: query.data ?? []
      },
      { headers: access.headers }
    );
  }, "api/v1/clients#get");
}

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const payload = await request.json();
    const parsed = clientCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const insert = await supabase
      .from("clients")
      .insert({
        agency_id: access.context.agencyId,
        name: parsed.data.name,
        domain: parsed.data.domain,
        industry: parsed.data.industry,
        active_platforms: parsed.data.activePlatforms ?? []
      })
      .select("id,name,domain,industry,health_score,active_platforms,created_at")
      .maybeSingle();

    if (insert.error || !insert.data) {
      return NextResponse.json({ ok: false, error: insert.error?.message ?? "Could not create client." }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        data: insert.data
      },
      {
        status: 201,
        headers: access.headers
      }
    );
  }, "api/v1/clients#post");
}
