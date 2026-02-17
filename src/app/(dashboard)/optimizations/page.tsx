import { DashboardHeader } from "@/components/layout/geo-shell";

const cards = [
  { title: "Schema Coverage Expansion", impact: "High", effort: "Medium", owner: "SEO Lead" },
  { title: "Authoritative FAQ Hub", impact: "High", effort: "Low", owner: "Content" },
  { title: "Citation Recovery Sprint", impact: "Medium", effort: "Medium", owner: "PR" },
  { title: "Brand Prompt Playbook", impact: "High", effort: "Low", owner: "Strategy" }
];

export default function OptimizationsPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Optimization Program"
        description="Prioritized initiatives aligned to visibility impact, effort level, and expected business value."
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="surface-panel p-6 lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Readiness Score</p>
          <div className="mt-2 flex items-end justify-between">
            <h2 className="text-4xl font-extrabold text-ink">74%</h2>
            <p className="text-sm font-semibold text-brand">+8.2 last 30 days</p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-brand" style={{ width: "74%" }} />
          </div>
        </article>

        <article className="surface-panel p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Quick Wins</p>
          <h2 className="mt-2 text-4xl font-extrabold text-ink">5</h2>
          <p className="mt-2 text-sm text-text-secondary">Can be delivered this sprint</p>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="surface-panel p-5">
            <h3 className="text-base font-bold text-ink">{card.title}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-brand-soft px-2 py-1 font-semibold text-brand">Impact: {card.impact}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">Effort: {card.effort}</span>
              <span className="rounded-full bg-white px-2 py-1 font-semibold text-slate-700 border border-surface-border">Owner: {card.owner}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
