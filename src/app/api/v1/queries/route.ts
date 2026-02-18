import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireExternalApiAccess } from "@/lib/api/external-api-auth";
import { withApiErrorHandling } from "@/lib/api/with-api-error-handling";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const queryCreateSchema = z.object({
  clientId: z.string().uuid(),
  text: z.string().trim().min(3),
  category: z.string().trim().min(2),
  priority: z.enum(["low", "medium", "high"]).default("medium")
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
      .from("queries")
      .select("id,client_id,text,category,priority,created_at,clients!inner(id,agency_id)")
      .eq("clients.agency_id", access.context.agencyId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const result = await query;
    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
    }

    const data = (result.data ?? []).map((row) => ({
      id: row.id,
      clientId: row.client_id,
      text: row.text,
      category: row.category,
      priority: row.priority,
      createdAt: row.created_at
    }));

    return NextResponse.json({ ok: true, data }, { headers: access.headers });
  }, "api/v1/queries#get");
}

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const parsed = queryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const clientResult = await supabase
      .from("clients")
      .select("id")
      .eq("id", parsed.data.clientId)
      .eq("agency_id", access.context.agencyId)
      .maybeSingle();

    if (clientResult.error || !clientResult.data) {
      return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
    }

    const insert = await supabase
      .from("queries")
      .insert({
        client_id: parsed.data.clientId,
        text: parsed.data.text,
        category: parsed.data.category,
        priority: parsed.data.priority
      })
      .select("id,client_id,text,category,priority,created_at")
      .maybeSingle();

    if (insert.error || !insert.data) {
      return NextResponse.json({ ok: false, error: insert.error?.message ?? "Could not create query." }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: insert.data.id,
          clientId: insert.data.client_id,
          text: insert.data.text,
          category: insert.data.category,
          priority: insert.data.priority,
          createdAt: insert.data.created_at
        }
      },
      { status: 201, headers: access.headers }
    );
  }, "api/v1/queries#post");
}
