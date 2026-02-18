import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { withApiErrorHandling } from "@/lib/api/with-api-error-handling";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Params = {
  params: {
    id: string;
  };
};

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

export async function DELETE(_request: Request, { params }: Params) {
  return withApiErrorHandling(async () => {
    const auth = await authorizeAdmin();
    if (!auth.ok) {
      return auth.response;
    }

    const supabase = createServerSupabaseClient(auth.accessToken);
    const revoke = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("agency_id", auth.currentUser.agencyId);

    if (revoke.error) {
      return NextResponse.json({ ok: false, error: revoke.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }, "api/v1/api-keys/[id]#delete");
}
