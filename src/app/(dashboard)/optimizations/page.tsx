import { getContentGapGroups, getOptimizationPayload } from "@/app/(dashboard)/actions/optimizations";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { ImpactEffortMatrix } from "@/components/optimizations/impact-effort-matrix";
import { KanbanBoard } from "@/components/optimizations/kanban-board";

type OptimizationsPageProps = {
  searchParams?: {
    clientId?: string;
  };
};

function priorityClass(priority: "low" | "medium" | "high") {
  if (priority === "high") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default async function OptimizationsPage({ searchParams }: OptimizationsPageProps) {
  const selectedClientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const [optimizationPayload, gapGroups] = await Promise.all([
    getOptimizationPayload(selectedClientId),
    getContentGapGroups(selectedClientId)
  ]);

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Content Optimizations"
        description="Kanban workflow, impact-effort prioritization, and category-level content gap opportunities."
      />

      {!selectedClientId ? (
        <section className="surface-panel mb-4 p-4 text-sm text-text-secondary">
          Select a client to persist board changes. Sample optimization data is shown for preview.
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="surface-panel p-6 lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Readiness Score</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <h2 className="text-4xl font-extrabold text-ink">{optimizationPayload.readinessScore}%</h2>
            <p className="text-sm font-semibold text-brand">{optimizationPayload.cards.length} active initiatives</p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${optimizationPayload.readinessScore}%` }} />
          </div>
        </article>

        <article className="surface-panel p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Quick Wins</p>
          <h2 className="mt-2 text-4xl font-extrabold text-ink">{optimizationPayload.quickWins}</h2>
          <p className="mt-2 text-sm text-text-secondary">High impact + low effort initiatives ready for execution.</p>
        </article>
      </section>

      <KanbanBoard initialCards={optimizationPayload.cards} />

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ImpactEffortMatrix cards={optimizationPayload.cards} />
        </div>

        <article className="surface-panel p-5 xl:col-span-2">
          <h2 className="text-lg font-bold text-ink">Content Gap Analysis</h2>
          <p className="mt-1 text-sm text-text-secondary">Missing coverage grouped by topic category with priority indicators.</p>

          <div className="mt-4 space-y-3">
            {gapGroups.length === 0 ? (
              <p className="text-sm text-text-secondary">No category gaps detected for this client.</p>
            ) : (
              gapGroups.map((group) => (
                <article className="rounded-xl border border-surface-border bg-white p-3" key={group.category}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{group.category}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${priorityClass(group.priority)}`}>
                      {group.priority} priority
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-secondary">
                    <span>{group.missingQueries} missing</span>
                    <span>&middot;</span>
                    <span>{group.coveredQueries}/{group.totalQueries} covered</span>
                    <span>&middot;</span>
                    <span>{group.coverageRate}% coverage</span>
                  </div>

                  <p className="mt-2 text-xs text-text-secondary">{group.recommendedAction}</p>

                  {group.examples.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {group.examples.map((example) => (
                        <p className="rounded-lg border border-surface-border bg-slate-50 px-2 py-1 text-xs text-ink" key={example}>
                          {example}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
