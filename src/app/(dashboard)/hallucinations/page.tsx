import { getHallucinationPayload, runCriticalHallucinationAlertAction } from "@/app/(dashboard)/actions/hallucinations";
import { HallucinationWorkbench } from "@/components/hallucinations/hallucination-workbench";
import { PlatformRiskChart } from "@/components/hallucinations/platform-risk-chart";
import { DashboardHeader } from "@/components/layout/geo-shell";

type HallucinationsPageProps = {
  searchParams?: {
    clientId?: string;
  };
};

export default async function HallucinationsPage({ searchParams }: HallucinationsPageProps) {
  const selectedClientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const [alertSyncResult, payload] = await Promise.all([
    selectedClientId
      ? runCriticalHallucinationAlertAction(selectedClientId)
      : Promise.resolve({ ok: true, created: 0, notificationsSent: 0 }),
    getHallucinationPayload(selectedClientId)
  ]);

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Hallucination Detection"
        description="Critical misinformation monitoring, correction progress, and platform-specific risk analysis."
      />

      {!selectedClientId ? (
        <section className="surface-panel mb-4 p-4 text-sm text-text-secondary">
          Select a client to run live hallucination checks. Sample data is shown for preview.
        </section>
      ) : null}

      {alertSyncResult.created > 0 ? (
        <section className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {alertSyncResult.created} critical hallucination alert(s) generated and notification events queued.
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Total Cases</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{payload.summary.total}</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Critical Risk</p>
          <p className="mt-2 text-3xl font-extrabold text-critical">{payload.summary.critical}</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Correction Success</p>
          <p className="mt-2 text-3xl font-extrabold text-success">{payload.summary.correctedRate}%</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Avg Resolution</p>
          <p className="mt-2 text-3xl font-extrabold text-warning">{payload.summary.avgResolutionHours}h</p>
        </article>
      </section>

      <div className="mt-6">
        <PlatformRiskChart rows={payload.rows} />
      </div>

      <div className="mt-6">
        <HallucinationWorkbench initialRows={payload.rows} />
      </div>
    </div>
  );
}
