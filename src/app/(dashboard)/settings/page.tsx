import Link from "next/link";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { WhiteLabelForm } from "@/components/settings/white-label-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function resolveDnsTarget() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    return "app.brandradar.ai";
  }

  try {
    return new URL(appUrl).hostname;
  } catch {
    return appUrl.replace(/^https?:\/\//, "").split("/")[0] || "app.brandradar.ai";
  }
}

async function getAgencyBranding(accessToken: string, agencyId: string) {
  const supabase = createServerSupabaseClient(accessToken);
  const { data } = await supabase
    .from("agencies")
    .select("name,logo_url,primary_color,secondary_color,custom_domain")
    .eq("id", agencyId)
    .maybeSingle();

  return {
    name: data?.name ?? "Agency",
    logoUrl: data?.logo_url ?? null,
    primaryColor: data?.primary_color ?? "#376df6",
    secondaryColor: data?.secondary_color ?? "#2563eb",
    customDomain: data?.custom_domain ?? null
  };
}

type ExportAuditLogRow = {
  id: string;
  file_name: string;
  scope: string;
  format: string;
  row_count: number;
  is_bulk: boolean;
  created_at: string;
};

async function getExportAuditLogs(accessToken: string, agencyId: string): Promise<ExportAuditLogRow[]> {
  const supabase = createServerSupabaseClient(accessToken);
  const query = await supabase
    .from("export_audit_logs")
    .select("id,file_name,scope,format,row_count,is_bulk,created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (query.error) {
    return [];
  }

  return query.data ?? [];
}

export default async function SettingsPage() {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  const currentUser = await getCurrentUser(accessToken);

  const agency = currentUser && accessToken ? await getAgencyBranding(accessToken, currentUser.agencyId) : null;
  const exportAuditLogs =
    currentUser?.role === "admin" && currentUser && accessToken
      ? await getExportAuditLogs(accessToken, currentUser.agencyId)
      : [];
  const dnsTarget = resolveDnsTarget();

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
        <>
          <WhiteLabelForm agency={agency} dnsTarget={dnsTarget} />

          <section className="surface-panel mt-6 overflow-hidden">
            <div className="border-b border-surface-border px-5 py-3">
              <p className="text-sm font-semibold text-ink">Export Audit Log</p>
              <p className="mt-1 text-xs text-text-secondary">Tracks export scope, format, file name, and row counts.</p>
            </div>

            {exportAuditLogs.length === 0 ? (
              <p className="px-5 py-4 text-sm text-text-secondary">No export events recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-slate-50 text-xs uppercase tracking-[0.12em] text-text-secondary">
                      <th className="px-5 py-3">Created</th>
                      <th className="px-5 py-3">Scope</th>
                      <th className="px-5 py-3">Format</th>
                      <th className="px-5 py-3">Rows</th>
                      <th className="px-5 py-3">Mode</th>
                      <th className="px-5 py-3">File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportAuditLogs.map((logRow) => (
                      <tr className="border-b border-surface-border/70" key={logRow.id}>
                        <td className="px-5 py-3 text-text-secondary">{new Date(logRow.created_at).toLocaleString("tr-TR")}</td>
                        <td className="px-5 py-3 font-medium text-ink">{logRow.scope}</td>
                        <td className="px-5 py-3 text-ink">{logRow.format.toUpperCase()}</td>
                        <td className="px-5 py-3 text-ink">{logRow.row_count}</td>
                        <td className="px-5 py-3 text-ink">{logRow.is_bulk ? "Bulk" : "Single"}</td>
                        <td className="px-5 py-3 text-text-secondary">{logRow.file_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="surface-panel p-6 text-sm text-text-secondary">
          White-label configuration is visible to admin users only.
        </section>
      )}
    </div>
  );
}
