import { DashboardHeader } from "@/components/layout/geo-shell";

const feed = [
  {
    platform: "Perplexity",
    sentiment: "Positive",
    query: "Most reliable electric SUV for enterprise fleet",
    excerpt: "Global Motors is cited as the most cost-efficient option with strong battery warranty coverage."
  },
  {
    platform: "ChatGPT",
    sentiment: "Neutral",
    query: "Fleet charging strategy for urban depots",
    excerpt: "Global Motors appears in benchmark comparisons but lacks clarity on charging partner ecosystem."
  },
  {
    platform: "Claude",
    sentiment: "Negative",
    query: "Safety recall history EV manufacturers",
    excerpt: "Model X-1 data is partially outdated and needs an authoritative correction source."
  }
];

export default function MentionsPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader title="Brand Mentions" description="Real-time mention telemetry, sentiment quality, and narrative pressure by platform." />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Total Mentions</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">4,285</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Positive</p>
          <p className="mt-2 text-3xl font-extrabold text-success">68%</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Neutral</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">21%</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Negative</p>
          <p className="mt-2 text-3xl font-extrabold text-critical">11%</p>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="surface-panel p-5">
          <h2 className="text-lg font-bold text-ink">Live Telemetry Feed</h2>
          <div className="mt-4 space-y-3">
            {feed.map((item) => (
              <div key={item.query} className="rounded-xl border border-surface-border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{item.platform}</p>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.sentiment === "Positive" ? "bg-emerald-100 text-emerald-700" : item.sentiment === "Negative" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                    {item.sentiment}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-ink">{item.query}</p>
                <p className="mt-2 text-sm text-text-secondary">{item.excerpt}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel p-5">
          <h2 className="text-lg font-bold text-ink">Sentiment Distribution</h2>
          <div className="mt-6 space-y-4">
            {[
              { label: "Positive", value: 68, color: "bg-emerald-500" },
              { label: "Neutral", value: 21, color: "bg-slate-500" },
              { label: "Negative", value: 11, color: "bg-red-500" }
            ].map((bar) => (
              <div key={bar.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{bar.label}</span>
                  <span className="font-mono text-text-secondary">{bar.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${bar.color}`} style={{ width: `${bar.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
