import { DashboardHeader } from "@/components/layout/geo-shell";

const competitors = [
  { name: "Brand A", sov: 28, citationGap: 14, risk: "Medium" },
  { name: "Brand B", sov: 19, citationGap: 21, risk: "High" },
  { name: "Brand C", sov: 11, citationGap: 9, risk: "Low" }
];

export default function CompetitorsPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Competitor Intelligence"
        description="Relative share-of-voice pressure, citation gaps, and strategic whitespace opportunities."
      />

      <section className="surface-panel p-6">
        <h2 className="text-lg font-bold text-ink">Competitive Landscape</h2>
        <div className="mt-5 h-72 rounded-2xl border border-surface-border bg-gradient-to-br from-white via-brand-soft/35 to-white p-4">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <polygon className="fill-brand/20 stroke-brand stroke-2" points="50,12 83,30 82,67 50,86 18,67 17,30" />
            <polygon className="fill-amber-200/30 stroke-amber-500 stroke-[1.5]" points="50,22 74,36 73,60 50,74 27,60 26,36" />
            <polygon className="fill-transparent stroke-slate-500 stroke-[1.5] stroke-dasharray-3" points="50,30 68,40 68,56 50,66 32,56 32,40" />
          </svg>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {competitors.map((item) => (
          <article key={item.name} className="surface-panel p-5">
            <h3 className="text-base font-bold text-ink">{item.name}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-surface-border bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-text-secondary">AI SoV</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{item.sov}%</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-text-secondary">Citation Gap</p>
                <p className="mt-1 text-2xl font-extrabold text-brand">{item.citationGap}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-text-secondary">Risk posture: <span className="font-semibold text-ink">{item.risk}</span></p>
          </article>
        ))}
      </section>
    </div>
  );
}
