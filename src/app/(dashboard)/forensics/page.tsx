import Link from "next/link";
import { getCitationForensicsPayload } from "@/app/(dashboard)/actions/citation-forensics";
import { AuthorityMap } from "@/components/citations/authority-map";
import { CitationTracking } from "@/components/citations/citation-tracking";
import { DashboardHeader } from "@/components/layout/geo-shell";

type ForensicsPageProps = {
  searchParams?: {
    clientId?: string;
    from?: string;
    to?: string;
  };
};

function buildRangeHref(clientId: string, days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const fromISO = from.toISOString().slice(0, 10);
  const toISO = to.toISOString().slice(0, 10);
  return `/forensics?clientId=${encodeURIComponent(clientId)}&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`;
}

export default async function ForensicsPage({ searchParams }: ForensicsPageProps) {
  const clientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const from = typeof searchParams?.from === "string" ? searchParams.from : undefined;
  const to = typeof searchParams?.to === "string" ? searchParams.to : undefined;
  const payload = await getCitationForensicsPayload(clientId, from, to);

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Citation Forensics"
        description="Source authority, gained/lost citations, and credibility concentration by platform."
        actions={
          clientId ? (
            <div className="flex flex-wrap gap-2">
              <Link className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft" href={buildRangeHref(clientId, 7)}>
                Last 7 Days
              </Link>
              <Link className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft" href={buildRangeHref(clientId, 30)}>
                Last 30 Days
              </Link>
              <Link className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft" href={buildRangeHref(clientId, 90)}>
                Last 90 Days
              </Link>
            </div>
          ) : null
        }
      />

      {!clientId ? (
        <section className="surface-panel p-5 text-sm text-text-secondary">Select a client first to open citation forensics.</section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <article className="surface-panel p-5 lg:col-span-3">
              <h2 className="text-lg font-bold text-ink">Authority Map</h2>
              <AuthorityMap points={payload.authorityPoints} />
            </article>

            <article className="surface-panel p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Source Types</p>
              <div className="mt-3 space-y-2">
                {payload.sourceTypeDistribution.slice(0, 6).map((item) => (
                  <div className="rounded-lg border border-surface-border bg-white px-3 py-2" key={item.type}>
                    <p className="text-xs font-semibold text-ink">{item.type}</p>
                    <p className="text-[11px] text-text-secondary">{item.count} citations</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6 surface-panel overflow-hidden">
            <div className="border-b border-surface-border px-5 py-3 text-sm font-bold text-ink">Top Cited Sources</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-surface-border bg-slate-50 text-xs uppercase tracking-[0.12em] text-text-secondary">
                  <tr>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Platform</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-right">Citations</th>
                    <th className="px-5 py-3 text-right">Authority</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.topSources.map((source) => (
                    <tr className="border-b border-surface-border/70" key={`${source.domain}-${source.sourceType}`}>
                      <td className="px-5 py-3 font-medium text-brand">{source.domain}</td>
                      <td className="px-5 py-3 text-text-secondary">{source.platform}</td>
                      <td className="px-5 py-3 text-text-secondary">{source.sourceType}</td>
                      <td className="px-5 py-3 text-right font-mono text-ink">{source.citations}</td>
                      <td className="px-5 py-3 text-right font-mono text-ink">{source.authority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-6">
            <CitationTracking gainedCount={payload.gainedCount} lostCount={payload.lostCount} rows={payload.trendRows} />
          </div>

          <section className="mt-6 surface-panel p-6">
            <h2 className="text-lg font-bold text-ink">Citation Gap Analysis</h2>
            <p className="mt-1 text-sm text-text-secondary">Sources where competitors are likely cited but client coverage is weak.</p>
            {payload.gapRows.length === 0 ? (
              <p className="mt-4 text-sm text-text-secondary">No citation gap opportunity found for this range.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-xs uppercase tracking-[0.12em] text-text-secondary">
                      <th className="px-2 py-2">Source</th>
                      <th className="px-2 py-2">Competitor</th>
                      <th className="px-2 py-2">Opportunity Score</th>
                      <th className="px-2 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.gapRows.map((row) => (
                      <tr className="border-b border-surface-border/60" key={`${row.source}-${row.competitor}`}>
                        <td className="px-2 py-3 font-semibold text-ink">{row.source}</td>
                        <td className="px-2 py-3 text-ink">{row.competitor}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 rounded-full bg-brand-soft">
                              <div className="h-2 rounded-full bg-brand" style={{ width: `${row.opportunityScore}%` }} />
                            </div>
                            <span className="font-semibold text-ink">{row.opportunityScore}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-text-secondary">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

