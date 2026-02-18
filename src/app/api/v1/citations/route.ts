import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireExternalApiAccess } from "@/lib/api/external-api-auth";
import { withApiErrorHandling } from "@/lib/api/with-api-error-handling";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const citationCreateSchema = z.object({
  clientId: z.string().uuid(),
  platformSlug: z.string().trim().min(2),
  query: z.string().trim().min(3),
  sourceUrl: z.string().url(),
  sourceType: z.enum(["wikipedia", "reddit", "review_site", "news", "blog", "other"]),
  authorityScore: z.number().int().min(0).max(100).optional(),
  detectedAt: z.string().datetime().optional()
});

export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const clientId = request.nextUrl.searchParams.get("clientId");
    const limitValue = Number(request.nextUrl.searchParams.get("limit") ?? "100");
    const limit = Math.min(500, Math.max(1, Number.isNaN(limitValue) ? 100 : limitValue));
    const supabase = createServiceRoleSupabaseClient();

    let query = supabase
      .from("citations")
      .select("id,client_id,query,source_url,source_type,authority_score,status,detected_at,platforms(name,slug),clients!inner(id,agency_id)")
      .eq("clients.agency_id", access.context.agencyId)
      .order("detected_at", { ascending: false })
      .limit(limit);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const result = await query;
    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
    }

    const data = (result.data ?? []).map((row) => {
      const platform = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms;
      return {
        id: row.id,
        clientId: row.client_id,
        platform: platform?.name ?? "Unknown",
        platformSlug: platform?.slug ?? "unknown",
        query: row.query,
        sourceUrl: row.source_url,
        sourceType: row.source_type,
        authorityScore: row.authority_score,
        status: row.status,
        detectedAt: row.detected_at
      };
    });

    return NextResponse.json({ ok: true, data }, { headers: access.headers });
  }, "api/v1/citations#get");
}

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const parsed = citationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const [clientResult, platformResult] = await Promise.all([
      supabase
        .from("clients")
        .select("id")
        .eq("id", parsed.data.clientId)
        .eq("agency_id", access.context.agencyId)
        .maybeSingle(),
      supabase.from("platforms").select("id").eq("slug", parsed.data.platformSlug).maybeSingle()
    ]);

    if (clientResult.error || !clientResult.data) {
      return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
    }
    if (platformResult.error || !platformResult.data) {
      return NextResponse.json({ ok: false, error: "Platform not found." }, { status: 404 });
    }

    const insert = await supabase
      .from("citations")
      .insert({
        client_id: parsed.data.clientId,
        platform_id: platformResult.data.id,
        query: parsed.data.query,
        source_url: parsed.data.sourceUrl,
        source_type: parsed.data.sourceType,
        authority_score: parsed.data.authorityScore ?? null,
        detected_at: parsed.data.detectedAt ?? new Date().toISOString()
      })
      .select("id,client_id,query,source_url,source_type,authority_score,status,detected_at")
      .maybeSingle();

    if (insert.error || !insert.data) {
      return NextResponse.json({ ok: false, error: insert.error?.message ?? "Could not create citation." }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        data: insert.data
      },
      { status: 201, headers: access.headers }
    );
  }, "api/v1/citations#post");
}
