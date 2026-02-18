import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireExternalApiAccess } from "@/lib/api/external-api-auth";
import { withApiErrorHandling } from "@/lib/api/with-api-error-handling";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

type Params = {
  params: {
    id: string;
  };
};

const queryUpdateSchema = z.object({
  text: z.string().trim().min(3).optional(),
  category: z.string().trim().min(2).optional(),
  priority: z.enum(["low", "medium", "high"]).optional()
});

function mapQueryRow(row: { id: string; client_id: string; text: string; category: string; priority: string; created_at: string }) {
  return {
    id: row.id,
    clientId: row.client_id,
    text: row.text,
    category: row.category,
    priority: row.priority,
    createdAt: row.created_at
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const supabase = createServiceRoleSupabaseClient();
    const query = await supabase
      .from("queries")
      .select("id,client_id,text,category,priority,created_at,clients!inner(id,agency_id)")
      .eq("id", params.id)
      .eq("clients.agency_id", access.context.agencyId)
      .maybeSingle();

    if (query.error) {
      return NextResponse.json({ ok: false, error: query.error.message }, { status: 500 });
    }
    if (!query.data) {
      return NextResponse.json({ ok: false, error: "Query not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: mapQueryRow(query.data) }, { headers: access.headers });
  }, "api/v1/queries/[id]#get");
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const parsed = queryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (parsed.data.text !== undefined) updatePayload.text = parsed.data.text;
    if (parsed.data.category !== undefined) updatePayload.category = parsed.data.category;
    if (parsed.data.priority !== undefined) updatePayload.priority = parsed.data.priority;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ ok: false, error: "No fields to update." }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const ownerQuery = await supabase
      .from("queries")
      .select("id,client_id,clients!inner(id,agency_id)")
      .eq("id", params.id)
      .eq("clients.agency_id", access.context.agencyId)
      .maybeSingle();
    if (ownerQuery.error) {
      return NextResponse.json({ ok: false, error: ownerQuery.error.message }, { status: 500 });
    }
    if (!ownerQuery.data) {
      return NextResponse.json({ ok: false, error: "Query not found." }, { status: 404 });
    }

    const update = await supabase
      .from("queries")
      .update(updatePayload)
      .eq("id", params.id)
      .select("id,client_id,text,category,priority,created_at")
      .maybeSingle();

    if (update.error || !update.data) {
      return NextResponse.json({ ok: false, error: update.error?.message ?? "Could not update query." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: mapQueryRow(update.data) }, { headers: access.headers });
  }, "api/v1/queries/[id]#patch");
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const supabase = createServiceRoleSupabaseClient();
    const ownerQuery = await supabase
      .from("queries")
      .select("id,clients!inner(id,agency_id)")
      .eq("id", params.id)
      .eq("clients.agency_id", access.context.agencyId)
      .maybeSingle();
    if (ownerQuery.error) {
      return NextResponse.json({ ok: false, error: ownerQuery.error.message }, { status: 500 });
    }
    if (!ownerQuery.data) {
      return NextResponse.json({ ok: false, error: "Query not found." }, { status: 404 });
    }

    const del = await supabase.from("queries").delete().eq("id", params.id);
    if (del.error) {
      return NextResponse.json({ ok: false, error: del.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { headers: access.headers });
  }, "api/v1/queries/[id]#delete");
}
