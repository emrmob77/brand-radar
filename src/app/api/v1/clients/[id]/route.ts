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

const clientUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  domain: z.string().trim().min(3).optional(),
  industry: z.string().trim().min(2).optional(),
  activePlatforms: z.array(z.string().trim()).optional()
});

export async function GET(request: NextRequest, { params }: Params) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const supabase = createServiceRoleSupabaseClient();
    const query = await supabase
      .from("clients")
      .select("id,name,domain,industry,logo_url,health_score,active_platforms,created_at,updated_at")
      .eq("id", params.id)
      .eq("agency_id", access.context.agencyId)
      .maybeSingle();

    if (query.error) {
      return NextResponse.json({ ok: false, error: query.error.message }, { status: 500 });
    }

    if (!query.data) {
      return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: query.data }, { headers: access.headers });
  }, "api/v1/clients/[id]#get");
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const parsed = clientUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
    if (parsed.data.domain !== undefined) updatePayload.domain = parsed.data.domain;
    if (parsed.data.industry !== undefined) updatePayload.industry = parsed.data.industry;
    if (parsed.data.activePlatforms !== undefined) updatePayload.active_platforms = parsed.data.activePlatforms;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ ok: false, error: "No fields to update." }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const update = await supabase
      .from("clients")
      .update(updatePayload)
      .eq("id", params.id)
      .eq("agency_id", access.context.agencyId)
      .select("id,name,domain,industry,health_score,active_platforms,updated_at")
      .maybeSingle();

    if (update.error) {
      return NextResponse.json({ ok: false, error: update.error.message }, { status: 500 });
    }
    if (!update.data) {
      return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: update.data }, { headers: access.headers });
  }, "api/v1/clients/[id]#patch");
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withApiErrorHandling(async () => {
    const access = await requireExternalApiAccess(request);
    if (!access.ok) {
      return access.response;
    }

    const supabase = createServiceRoleSupabaseClient();
    const remove = await supabase
      .from("clients")
      .delete()
      .eq("id", params.id)
      .eq("agency_id", access.context.agencyId)
      .select("id")
      .maybeSingle();

    if (remove.error) {
      return NextResponse.json({ ok: false, error: remove.error.message }, { status: 500 });
    }
    if (!remove.data) {
      return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { headers: access.headers });
  }, "api/v1/clients/[id]#delete");
}
