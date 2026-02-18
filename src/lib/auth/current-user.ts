import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppUserRole = "admin" | "editor" | "viewer";

export type CurrentUser = {
  id: string;
  agencyId: string;
  email: string;
  fullName: string;
  role: AppUserRole;
};

export async function getCurrentUser(accessToken: string | null | undefined): Promise<CurrentUser | null> {
  if (!accessToken) {
    return null;
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("users")
    .select("id,agency_id,email,full_name,role")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    agencyId: data.agency_id,
    email: data.email,
    fullName: data.full_name,
    role: data.role as AppUserRole
  };
}
