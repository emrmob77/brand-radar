import { DashboardHeader } from "@/components/layout/geo-shell";

const incidents = [
  {
    model: "ChatGPT-4o",
    severity: "Critical",
    incorrect: "X-1 includes solar package as standard in all trims.",
    corrected: "Solar package is optional and available only on X-1 Pro."
  },
  {
    model: "Perplexity",
    severity: "High",
    incorrect: "Battery warranty is 4 years / 80k km.",
    corrected: "Battery warranty is 8 years / 160k km."
  }
];

export default function HallucinationsPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Hallucination Control Center"
        description="Monitor critical misinformation and track correction progress across AI models."
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="surface-panel p-4"><p className="text-xs text-text-secondary uppercase tracking-[0.12em]">Total Cases</p><p className="mt-2 text-3xl font-extrabold text-ink">124</p></article>
        <article className="surface-panel p-4"><p className="text-xs text-text-secondary uppercase tracking-[0.12em]">Critical</p><p className="mt-2 text-3xl font-extrabold text-critical">12</p></article>
        <article className="surface-panel p-4"><p className="text-xs text-text-secondary uppercase tracking-[0.12em]">Correction Success</p><p className="mt-2 text-3xl font-extrabold text-success">89.2%</p></article>
        <article className="surface-panel p-4"><p className="text-xs text-text-secondary uppercase tracking-[0.12em]">Avg Resolution</p><p className="mt-2 text-3xl font-extrabold text-warning">4.2h</p></article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {incidents.map((incident) => (
            <article key={incident.incorrect} className="surface-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-surface-border bg-slate-50 px-5 py-3">
                <p className="text-sm font-bold text-ink">{incident.model}</p>
                <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">{incident.severity}</span>
              </div>
              <div className="space-y-3 p-5">
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{incident.incorrect}</div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{incident.corrected}</div>
              </div>
            </article>
          ))}
        </div>

        <aside className="surface-panel p-5">
          <h2 className="text-base font-bold text-ink">Risk Distribution</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-text-secondary">Critical</span><span className="font-semibold text-critical">12</span></div>
            <div className="flex items-center justify-between"><span className="text-text-secondary">High</span><span className="font-semibold text-warning">28</span></div>
            <div className="flex items-center justify-between"><span className="text-text-secondary">Medium</span><span className="font-semibold text-ink">44</span></div>
            <div className="flex items-center justify-between"><span className="text-text-secondary">Low</span><span className="font-semibold text-success">40</span></div>
          </div>
        </aside>
      </section>
    </div>
  );
}
