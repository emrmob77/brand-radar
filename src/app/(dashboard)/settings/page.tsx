import Link from "next/link";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { WhiteLabelForm } from "@/components/settings/white-label-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getAgencyBranding(accessToken: string, agencyId: string) {
  const supabase = createServerSupabaseClient(accessToken);
  const { data } = await supabase
    .from("agencies")
    .select("name,logo_url,primary_color,secondary_color")
    .eq("id", agencyId)
    .maybeSingle();

  return {
    name: data?.name ?? "Agency",
    logoUrl: data?.logo_url ?? null,
    primaryColor: data?.primary_color ?? "#376df6",
    secondaryColor: data?.secondary_color ?? "#2563eb"
  };
}

export default async function SettingsPage() {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  const currentUser = await getCurrentUser(accessToken);

  const agency = currentUser && accessToken ? await getAgencyBranding(accessToken, currentUser.agencyId) : null;

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Workspace Settings"
        description="Manage company profile, branding, and permission-sensitive configuration."
      />

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          className="surface-panel focus-ring block p-4 hover:border-brand/40"
          href="/settings/users"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Team Access</p>
          <p className="mt-2 text-lg font-bold text-ink">User Management</p>
          <p className="mt-1 text-sm text-text-secondary">Invite users and assign admin/editor/viewer roles.</p>
        </Link>
        <Link
          className="surface-panel focus-ring block p-4 hover:border-brand/40"
          href="/settings/white-label"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Branding</p>
          <p className="mt-2 text-lg font-bold text-ink">White-Label</p>
          <p className="mt-1 text-sm text-text-secondary">Logo, color palette, and company identity settings.</p>
        </Link>
        <article className="surface-panel p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Current Role</p>
          <p className="mt-2 text-lg font-bold text-ink">{currentUser?.role ?? "Unknown"}</p>
          <p className="mt-1 text-sm text-text-secondary">Admin role is required for write access on sensitive settings.</p>
        </article>
      </section>

      {currentUser?.role === "admin" && agency ? (
        <WhiteLabelForm agency={agency} />
      ) : (
        <section className="surface-panel p-6 text-sm text-text-secondary">
          White-label configuration is visible to admin users only.
        </section>
      )}
    </div>
  );
}
