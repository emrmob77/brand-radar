import { Building2, Sparkles, TrendingUp, TriangleAlert } from "lucide-react";
import { cookies } from "next/headers";
import { getDashboardMetricCards } from "@/app/(dashboard)/actions/metrics";
import { getMentionFeedPage, type MentionFeedRow } from "@/app/(dashboard)/actions/mentions";
import { getVisibilityTrendPayload } from "@/app/(dashboard)/actions/visibility-trend";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { LiveMentionsFeed } from "@/components/dashboard/live-mentions-feed";
import { MetricCard } from "@/components/dashboard/metric-card";
import { VisibilityTrend } from "@/components/dashboard/visibility-trend";
import { DashboardHeader } from "@/components/layout/geo-shell";

const mentions = [
  {
    platform: "Perplexity",
    title: "Top EV fleet recommendations",
    time: "2m ago",
    relevance: "97%"
  },
  {
    platform: "ChatGPT",
    title: "Commercial vehicle TCO benchmark",
    time: "12m ago",
    relevance: "91%"
  },
  {
    platform: "Claude",
    title: "Sustainability claims verification",
    time: "26m ago",
    relevance: "88%"
  }
];

async function getInitialMentions(clientId: string | null) {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return {
      accessToken: null,
      rows: []
    };
  }

  const page = await getMentionFeedPage({
    clientId,
    page: 0,
    pageSize: 20
  });
  const rows = page.rows;

  if (rows.length === 0) {
    return {
      accessToken,
      rows: mentions.map((item, index): MentionFeedRow => ({
        id: `mock-${index}`,
        platform: item.platform,
        sentiment: item.platform === "Claude" ? "negative" : "neutral",
        query: item.title,
        excerpt: item.title,
        detectedAt: new Date().toISOString()
      }))
    };
  }

  return {
    accessToken,
    rows
  };
}

type DashboardPageProps = {
  searchParams?: {
    clientId?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const selectedClientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const [kpis, trendPayload, initialMentions] = await Promise.all([
    getDashboardMetricCards(selectedClientId),
    getVisibilityTrendPayload(selectedClientId),
    getInitialMentions(selectedClientId)
  ]);

  const totalForPoint = (point?: (typeof trendPayload.data)[number]) =>
    trendPayload.platforms.reduce((sum, platform) => sum + Number(point?.[platform.slug] ?? 0), 0);

  const firstTrendPoint = trendPayload.data[0];
  const latestTrendPoint = trendPayload.data[trendPayload.data.length - 1];
  const previousTrendPoint = trendPayload.data[trendPayload.data.length - 2];
  const visibilityDelta = totalForPoint(latestTrendPoint) - totalForPoint(firstTrendPoint);
  const acceleration = totalForPoint(latestTrendPoint) - totalForPoint(previousTrendPoint);
  const lastSeven = trendPayload.data.slice(-7);
  const trailingAverage =
    lastSeven.length > 0
      ? lastSeven.reduce((sum, point) => sum + totalForPoint(point), 0) / lastSeven.length
      : 0;
  const benchmarkGap = totalForPoint(latestTrendPoint) - trailingAverage;

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Executive Dashboard"
        description="Unified corporate visibility, citation quality, and reputation risk signals across AI platforms."
        actions={
          <>
            <button className="focus-ring inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft" type="button">
              <Building2 className="h-4 w-4 text-ink" />
              Global Motors Inc.
            </button>
            <button className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600" type="button">
              <Sparkles className="h-4 w-4" />
              Generate Brief
            </button>
          </>
        }
      />

      <section className="surface-panel panel-hover overflow-hidden rounded-2xl bg-brand text-white">
        <div className="bg-gradient-to-r from-[#16191f] via-[#1a1e26] to-[#101216] px-6 py-7 md:px-8 md:py-9">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">Executive Pulse</p>
          <h2 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight md:text-3xl">
            Visibility is outperforming the benchmark across high-intent queries.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/72">
            Performance remains strong, while sustainability and compliance narratives require source reinforcement to keep trust metrics elevated.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/18 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/80">Confidence 92%</span>
            <span className="rounded-full border border-white/18 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/80">Risk Alerts 2</span>
            <span className="rounded-full border border-white/18 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/80">Citations +8.3%</span>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <MetricCard
            change={kpi.delta}
            description={kpi.description}
            format={kpi.format}
            key={kpi.label}
            positive={kpi.positive}
            sparkline={kpi.sparkline}
            value={kpi.value}
            title={kpi.label}
          />
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="surface-panel panel-hover xl:col-span-2 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Visibility Trend</h2>
              <p className="text-sm text-text-secondary">30-day trajectory across enterprise query clusters</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-ink">
              <TrendingUp className="h-3.5 w-3.5" />
              Momentum +{visibilityDelta.toFixed(1)} pts
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-surface-border bg-[#fbfbfc] p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-surface-border bg-white px-3 py-2.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary">Current</p>
                <p className="mt-1 text-base font-semibold text-ink">{totalForPoint(latestTrendPoint)} mentions</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-white px-3 py-2.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary">Vs 7D Average</p>
                <p className="mt-1 text-base font-semibold text-ink">{`${benchmarkGap >= 0 ? "+" : ""}${benchmarkGap.toFixed(1)} pts`}</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-white px-3 py-2.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary">Acceleration</p>
                <p className="mt-1 text-base font-semibold text-ink">{`${acceleration >= 0 ? "+" : ""}${acceleration.toFixed(1)} pts`}</p>
              </div>
            </div>

            <VisibilityTrend payload={trendPayload} />

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-text-secondary">
              <p>Updated {latestTrendPoint?.label ?? "N/A"} | Last 30 days</p>
            </div>
          </div>
        </article>

        <LiveMentionsFeed accessToken={initialMentions.accessToken} clientId={selectedClientId} initialMentions={initialMentions.rows} />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="surface-panel panel-hover p-6">
          <h3 className="text-base font-semibold text-ink">Top Opportunities</h3>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            <li>Fleet electrification comparison pages show high acquisition intent.</li>
            <li>Authority gaps detected in neutral technical explainer content.</li>
            <li>Rising demand in Turkish-language procurement prompts.</li>
          </ul>
        </article>
        <article className="surface-panel panel-hover p-6">
          <h3 className="text-base font-semibold text-ink">Risk Watch</h3>
          <div className="mt-3 rounded-xl border border-[#efdbd9] bg-[#fdf5f4] p-3 text-sm text-[#8f2f28]">
            <div className="flex items-center gap-2 font-semibold">
              <TriangleAlert className="h-4 w-4" />
              Sentiment drift in sustainability claims
            </div>
            <p className="mt-1 text-[#9f3b33]">3 mention clusters require factual reinforcement.</p>
          </div>
        </article>
        <article className="surface-panel panel-hover p-6">
          <h3 className="text-base font-semibold text-ink">Leadership Summary</h3>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Overall brand visibility remains strong with above-benchmark citation quality. Tactical action is recommended in
            regulatory and sustainability narratives to sustain executive trust.
          </p>
        </article>
      </section>
    </div>
  );
}
