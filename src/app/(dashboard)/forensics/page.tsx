import { DashboardHeader } from "@/components/layout/geo-shell";

const sources = [
  { domain: "wikipedia.org", platform: "Perplexity", citations: 243, score: 98 },
  { domain: "caranddriver.com", platform: "ChatGPT", citations: 126, score: 91 },
  { domain: "motortrend.com", platform: "Claude", citations: 87, score: 86 },
  { domain: "reddit.com", platform: "Google AI", citations: 64, score: 79 }
];

export default function ForensicsPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader title="Citation Forensics" description="Source authority, gained/lost citations, and credibility concentration by platform." />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <article className="surface-panel p-5 lg:col-span-3">
          <h2 className="text-lg font-bold text-ink">Authority Map</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-surface-border bg-brand-soft p-4">
              <p className="text-sm font-bold text-ink">Wikipedia</p>
              <p className="mt-1 text-xs text-text-secondary">DA 98 • 243 citations</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                "CarAndDriver",
                "MotorTrend",
                "Reddit",
                "Edmunds"
              ].map((source) => (
                <div key={source} className="rounded-lg border border-surface-border bg-white p-2 text-xs font-semibold text-ink">
                  {source}
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="surface-panel p-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-text-secondary font-semibold">New Citations</p>
          <p className="mt-2 text-4xl font-extrabold text-success">+12</p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-text-secondary font-semibold">Lost Citations</p>
          <p className="mt-2 text-4xl font-extrabold text-critical">-3</p>
        </article>
      </section>

      <section className="mt-6 surface-panel overflow-hidden">
        <div className="border-b border-surface-border px-5 py-3 text-sm font-bold text-ink">Citation Sources</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-surface-border bg-slate-50 text-xs uppercase tracking-[0.12em] text-text-secondary">
              <tr>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Platform</th>
                <th className="px-5 py-3 text-right">Citations</th>
                <th className="px-5 py-3 text-right">Authority</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.domain} className="border-b border-surface-border/70">
                  <td className="px-5 py-3 font-medium text-brand">{source.domain}</td>
                  <td className="px-5 py-3 text-text-secondary">{source.platform}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{source.citations}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{source.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
