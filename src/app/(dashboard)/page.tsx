import { ArrowDownRight, ArrowUpRight, Building2, Sparkles, TrendingUp, TriangleAlert } from "lucide-react";
import { DashboardHeader } from "@/components/layout/geo-shell";

const kpis = [
  {
    label: "AI Share of Voice",
    value: "32.4%",
    delta: "+4.8%",
    positive: true,
    description: "vs previous month",
    progress: 78
  },
  {
    label: "Qualified Citations",
    value: "1,842",
    delta: "+126",
    positive: true,
    description: "high-authority sources",
    progress: 84
  },
  {
    label: "Sentiment Health",
    value: "81 / 100",
    delta: "-2.1",
    positive: false,
    description: "needs attention",
    progress: 62
  },
  {
    label: "Est. Traffic Value",
    value: "$68,300",
    delta: "+12.2%",
    positive: true,
    description: "pipeline contribution",
    progress: 74
  }
];

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

const trendData = [
  { label: "Jan 06", visibility: 47, benchmark: 44 },
  { label: "Jan 09", visibility: 49, benchmark: 45 },
  { label: "Jan 12", visibility: 48, benchmark: 45 },
  { label: "Jan 15", visibility: 52, benchmark: 46 },
  { label: "Jan 18", visibility: 55, benchmark: 47 },
  { label: "Jan 21", visibility: 57, benchmark: 48 },
  { label: "Jan 24", visibility: 56, benchmark: 49 },
  { label: "Jan 27", visibility: 60, benchmark: 50 },
  { label: "Jan 30", visibility: 63, benchmark: 52 },
  { label: "Feb 02", visibility: 66, benchmark: 54 },
  { label: "Feb 05", visibility: 68, benchmark: 55 },
  { label: "Feb 08", visibility: 71, benchmark: 57 }
];

const chartWidth = 720;
const chartHeight = 286;
const chartPadding = {
  top: 18,
  right: 24,
  bottom: 46,
  left: 48
};

const visibleMin = 42;
const visibleMax = 74;
const yTicks = [44, 50, 56, 62, 68, 74];
const xTickIndexes = [0, 2, 4, 6, 8, 10, 11];

const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

function getX(index: number, total: number) {
  if (total <= 1) return chartPadding.left;

  return chartPadding.left + (index / (total - 1)) * innerWidth;
}

function getY(value: number) {
  const ratio = (value - visibleMin) / (visibleMax - visibleMin);
  return chartPadding.top + (1 - ratio) * innerHeight;
}

function getPolylinePoints(values: number[]) {
  const total = values.length;
  return values.map((value, index) => `${getX(index, total)},${getY(value)}`).join(" ");
}

function getAreaPath(values: number[]) {
  const total = values.length;

  if (!total) return "";

  const linePath = values
    .map((value, index) => `${index === 0 ? "M" : "L"} ${getX(index, total)} ${getY(value)}`)
    .join(" ");
  const lastX = getX(total - 1, total);
  const firstX = getX(0, total);
  const baselineY = chartHeight - chartPadding.bottom;

  return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
}

export default function DashboardPage() {
  const visibilitySeries = trendData.map((point) => point.visibility);
  const benchmarkSeries = trendData.map((point) => point.benchmark);
  const latestPoint = trendData[trendData.length - 1];
  const previousPoint = trendData[trendData.length - 2];
  const visibilityDelta = latestPoint.visibility - trendData[0].visibility;
  const acceleration = latestPoint.visibility - previousPoint.visibility;
  const benchmarkGap = latestPoint.visibility - latestPoint.benchmark;

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
          <article key={kpi.label} className="surface-panel panel-hover stagger-in p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-secondary">{kpi.label}</p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  kpi.positive ? "bg-brand-soft text-ink" : "bg-[#f8ebea] text-critical"
                }`}
              >
                {kpi.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {kpi.delta}
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">{kpi.value}</p>
            <p className="mt-1 text-xs text-text-secondary">{kpi.description}</p>
            <div className="mt-4 h-1 rounded-full bg-brand-soft">
              <div className={`h-1 rounded-full ${kpi.positive ? "bg-brand" : "bg-critical"}`} style={{ width: `${kpi.progress}%` }} />
            </div>
          </article>
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
                <p className="mt-1 text-base font-semibold text-ink">{latestPoint.visibility}% visibility</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-white px-3 py-2.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary">Vs Benchmark</p>
                <p className="mt-1 text-base font-semibold text-ink">+{benchmarkGap.toFixed(1)} pts</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-white px-3 py-2.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary">Acceleration</p>
                <p className="mt-1 text-base font-semibold text-ink">+{acceleration.toFixed(1)} pts</p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <svg aria-label="Visibility trend line chart" className="h-[296px] min-w-[640px] w-full" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <defs>
                  <linearGradient id="visibilityAreaFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#171a20" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#171a20" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {yTicks.map((tick) => (
                  <g key={tick}>
                    <line x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={getY(tick)} y2={getY(tick)} stroke="#d9dadd" strokeDasharray="2 4" />
                    <text fill="#8b9097" fontSize="11" textAnchor="end" x={chartPadding.left - 10} y={getY(tick) + 4}>
                      {tick}
                    </text>
                  </g>
                ))}

                {xTickIndexes.map((tickIndex) => (
                  <text
                    key={trendData[tickIndex].label}
                    fill="#8b9097"
                    fontSize="11"
                    textAnchor="middle"
                    x={getX(tickIndex, trendData.length)}
                    y={chartHeight - chartPadding.bottom + 22}
                  >
                    {trendData[tickIndex].label}
                  </text>
                ))}

                <polyline
                  fill="none"
                  points={getPolylinePoints(benchmarkSeries)}
                  stroke="#a2a7af"
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                  strokeWidth="2"
                />

                <path d={getAreaPath(visibilitySeries)} fill="url(#visibilityAreaFill)" />

                <polyline fill="none" points={getPolylinePoints(visibilitySeries)} stroke="#171a20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

                {visibilitySeries.map((point, index) => {
                  if (index !== trendData.length - 1 && index !== trendData.length - 4 && index !== trendData.length - 8) return null;

                  return (
                    <circle
                      key={`${trendData[index].label}-visibility-point`}
                      cx={getX(index, trendData.length)}
                      cy={getY(point)}
                      fill="#ffffff"
                      r="5"
                      stroke="#171a20"
                      strokeWidth="2.5"
                    />
                  );
                })}

                <g>
                  <circle cx={getX(trendData.length - 1, trendData.length)} cy={getY(latestPoint.visibility)} fill="#171a20" r="4.5" />
                  <circle cx={getX(trendData.length - 1, trendData.length)} cy={getY(latestPoint.visibility)} fill="none" r="10" stroke="#171a20" strokeOpacity="0.2" strokeWidth="2" />
                </g>
              </svg>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-text-secondary">
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                Brand Visibility
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-0.5 w-4 rounded bg-[#a2a7af]" />
                Benchmark Cohort
              </div>
              <p>Updated {latestPoint.label} | Confidence: 92%</p>
            </div>
          </div>
        </article>

        <article className="surface-panel panel-hover p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Live Mentions</h2>
            <span className="rounded-full border border-surface-border bg-brand-soft px-2 py-1 text-[11px] font-semibold text-ink">LIVE</span>
          </div>

          <div className="mt-4 space-y-3">
            {mentions.map((mention) => (
              <div key={mention.title} className="rounded-xl border border-surface-border bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{mention.platform}</p>
                  <p className="text-[11px] font-mono text-text-secondary">{mention.time}</p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{mention.title}</p>
                <p className="mt-2 text-[11px] font-semibold text-ink">Relevance {mention.relevance}</p>
              </div>
            ))}
          </div>
        </article>
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
