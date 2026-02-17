import { getAlertsPagePayload } from "@/app/(dashboard)/actions/alerts";
import { AlertsCenter } from "@/components/alerts/alerts-center";
import { DashboardHeader } from "@/components/layout/geo-shell";

type AlertsPageProps = {
  searchParams?: {
    clientId?: string;
  };
};

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const selectedClientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const payload = await getAlertsPagePayload(selectedClientId);

  const criticalCount = payload.alerts.filter((alert) => alert.severity === "critical").length;
  const warningCount = payload.alerts.filter((alert) => alert.severity === "warning").length;

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Alerts and Notifications"
        description="Rule-driven monitoring for mentions, sentiment, citations, hallucinations, and competitor movement."
      />

      {!selectedClientId ? (
        <section className="surface-panel mb-4 p-4 text-sm text-text-secondary">
          Select a client to manage real alert rules. Sample alert feed is shown for preview.
        </section>
      ) : null}

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Unread</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{payload.unreadCount}</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Critical</p>
          <p className="mt-2 text-3xl font-extrabold text-critical">{criticalCount}</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Warnings</p>
          <p className="mt-2 text-3xl font-extrabold text-warning">{warningCount}</p>
        </article>
      </section>

      <AlertsCenter clientId={selectedClientId} initialAlerts={payload.alerts} initialRules={payload.rules} />
    </div>
  );
}
