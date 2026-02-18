import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { UserManagement } from "@/components/settings/user-management";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getUsersPageData(accessToken: string, agencyId: string) {
  const supabase = createServerSupabaseClient(accessToken);
  const [usersResult, clientsResult] = await Promise.all([
    supabase
      .from("users")
      .select("id,full_name,email,role,last_login")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: true }),
    supabase
      .from("clients")
      .select("id,name")
      .eq("agency_id", agencyId)
      .order("name", { ascending: true })
  ]);

  return {
    users:
      usersResult.data?.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        role: row.role as "admin" | "editor" | "viewer",
        lastLogin: row.last_login
      })) ?? [],
    clients:
      clientsResult.data?.map((row) => ({
        id: row.id,
        name: row.name
      })) ?? []
  };
}

export default async function UsersSettingsPage() {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  const currentUser = await getCurrentUser(accessToken);

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "admin") {
    redirect("/forbidden?reason=admin_required&from=%2Fsettings%2Fusers");
  }

  const data = await getUsersPageData(accessToken ?? "", currentUser.agencyId);

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="User Management"
        description="Admin-only workspace user administration with role assignment and invite flow."
      />
      <UserManagement clients={data.clients} users={data.users} />
    </div>
  );
}
