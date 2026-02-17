import { Plus } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { getCompetitorAnalysisPayload } from "@/app/(dashboard)/actions/competitor-analysis";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { CompetitiveRadar } from "@/components/competitors/competitive-radar";
import { QueryBattleMap } from "@/components/competitors/query-battle-map";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CompetitorsPageProps = {
  searchParams?: {
    clientId?: string;
  };
};

type CompetitorRow = {
  id: string;
  name: string;
  domain: string;
};

type ClientRow = {
  id: string;
  name: string;
  health_score: number;
};

function metricFromString(input: string, min: number, max: number) {
  const hash = input.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return min + (hash % (max - min + 1));
}

async function getCompetitorViewData(clientId: string | null): Promise<{ client: ClientRow | null; competitors: CompetitorRow[] }> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return { client: null, competitors: [] };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [clientResult, competitorsResult] = await Promise.all([
    supabase.from("clients").select("id,name,health_score").eq("id", clientId).maybeSingle(),
    supabase.from("competitors").select("id,name,domain").eq("client_id", clientId).order("created_at", { ascending: false })
  ]);

  return {
    client: clientResult.data,
    competitors: competitorsResult.data ?? []
  };
}

function buildRadarPayload(client: ClientRow, competitors: CompetitorRow[]) {
  const palette = ["#376df6", "#ef4444", "#22c55e", "#f59e0b", "#7c3aed"];
  const metrics = ["Visibility", "Citation Authority", "Sentiment", "Topic Coverage", "Momentum"];
  const normalizedCompetitors = competitors.slice(0, 4);

  const series = [
    { key: "client", label: client.name, color: palette[0] ?? "#376df6" },
    ...normalizedCompetitors.map((item, index) => ({
      key: `competitor_${index}`,
      label: item.name,
      color: palette[index + 1] ?? "#ef4444"
    }))
  ];

  const data = metrics.map((metric) => {
    const row: { metric: string; [key: string]: string | number } = { metric };
    row.client = Math.min(100, Math.max(20, client.health_score + metricFromString(`${client.id}-${metric}`, -10, 12)));

    normalizedCompetitors.forEach((item, index) => {
      row[`competitor_${index}`] = metricFromString(`${item.id}-${metric}`, 28, 88);
    });

    return row;
  });

  return { data, series };
}

export default async function CompetitorsPage({ searchParams }: CompetitorsPageProps) {
  const selectedClientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const [{ client, competitors }, analysisPayload] = await Promise.all([
    getCompetitorViewData(selectedClientId),
    getCompetitorAnalysisPayload(selectedClientId)
  ]);
  const addCompetitorHref = selectedClientId ? `/competitors/new?clientId=${encodeURIComponent(selectedClientId)}` : "/competitors/new";
  const radarPayload = client ? buildRadarPayload(client, competitors) : null;

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        actions={
          <Link className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600" href={addCompetitorHref}>
            <Plus className="h-4 w-4" />
            Add Competitor
          </Link>
        }
        description="Relative share-of-voice pressure, citation gaps, and strategic whitespace opportunities."
        title="Competitor Intelligence"
      />

      {!selectedClientId || !client ? (
        <section className="surface-panel p-5 text-sm text-text-secondary">Select a client first to view competitor analysis.</section>
      ) : (
        <>
          {radarPayload ? <CompetitiveRadar data={radarPayload.data} series={radarPayload.series} /> : null}

          <section className="mt-6 surface-panel p-6">
            <h2 className="text-lg font-bold text-ink">Gap Analysis</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Queries where competitors appear while your selected client has no coverage.
            </p>

            {analysisPayload.gapRows.length === 0 ? (
              <p className="mt-4 text-sm text-text-secondary">No query gap was detected for this client.</p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[840px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-xs uppercase tracking-[0.12em] text-text-secondary">
                      <th className="px-2 py-2">Query</th>
                      <th className="px-2 py-2">Category</th>
                      <th className="px-2 py-2">Competitor</th>
                      <th className="px-2 py-2">Competitor Coverage</th>
                      <th className="px-2 py-2">Client Mentions</th>
                      <th className="px-2 py-2">Opportunity Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisPayload.gapRows.map((row) => (
                      <tr className="border-b border-surface-border/60" key={`${row.query}-${row.competitorName}`}>
                        <td className="px-2 py-3 text-ink">{row.query}</td>
                        <td className="px-2 py-3 text-text-secondary">{row.category}</td>
                        <td className="px-2 py-3 font-semibold text-ink">{row.competitorName}</td>
                        <td className="px-2 py-3 text-ink">{row.competitorCoverage}%</td>
                        <td className="px-2 py-3 text-ink">{row.clientMentions}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 rounded-full bg-brand-soft">
                              <div className="h-2 rounded-full bg-brand" style={{ width: `${row.opportunityScore}%` }} />
                            </div>
                            <span className="font-semibold text-ink">{row.opportunityScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-6 surface-panel p-6">
            <h2 className="text-lg font-bold text-ink">Query Battle Map</h2>
            <p className="mt-1 text-sm text-text-secondary">Brand-by-query visibility matrix with category filter.</p>
            <QueryBattleMap brands={analysisPayload.brands} rows={analysisPayload.battleRows} />
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {competitors.length === 0 ? (
              <article className="surface-panel col-span-full p-5 text-sm text-text-secondary">No competitors added for this client yet.</article>
            ) : (
              competitors.map((item) => {
                const sov = metricFromString(item.id, 5, 40);
                const citationGap = metricFromString(item.domain, 2, 30);
                const riskScore = metricFromString(item.name, 1, 100);
                const riskLabel = riskScore > 70 ? "High" : riskScore > 40 ? "Medium" : "Low";

                return (
                  <article className="surface-panel p-5" key={item.id}>
                    <h3 className="text-base font-bold text-ink">{item.name}</h3>
                    <p className="mt-1 text-xs text-text-secondary">{item.domain}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-surface-border bg-white p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-text-secondary">AI SoV</p>
                        <p className="mt-1 text-2xl font-extrabold text-ink">{sov}%</p>
                      </div>
                      <div className="rounded-xl border border-surface-border bg-white p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-text-secondary">Citation Gap</p>
                        <p className="mt-1 text-2xl font-extrabold text-brand">{citationGap}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-text-secondary">
                      Risk posture: <span className="font-semibold text-ink">{riskLabel}</span>
                    </p>
                  </article>
                );
              })
            )}
          </section>
        </>
      )}
    </div>
  );
}
