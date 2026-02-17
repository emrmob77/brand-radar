import { DashboardHeader } from "@/components/layout/geo-shell";

const channels = [
  { name: "ChatGPT", share: 36, delta: "+5.2" },
  { name: "Perplexity", share: 24, delta: "+3.9" },
  { name: "Google AI Overviews", share: 18, delta: "+1.1" },
  { name: "Claude", share: 14, delta: "+2.8" },
  { name: "Bing Copilot", share: 8, delta: "-0.4" }
];

export default function VisibilityPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="AI Visibility Matrix"
        description="Platform-level share of voice and category penetration across strategic query clusters."
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {channels.map((channel) => (
          <article key={channel.name} className="surface-panel p-4">
            <p className="text-sm font-semibold text-ink">{channel.name}</p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{channel.share}%</p>
            <p className="mt-1 text-xs font-semibold text-brand">{channel.delta} pts</p>
          </article>
        ))}
      </section>

      <section className="mt-6 surface-panel p-6">
        <h2 className="text-lg font-bold text-ink">Platform x Topic Heatmap</h2>
        <p className="mt-1 text-sm text-text-secondary">Relative dominance across high-intent topic categories</p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-2 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left text-xs uppercase tracking-[0.14em] text-text-secondary">Topic</th>
                {channels.map((channel) => (
                  <th key={channel.name} className="px-2 py-2 text-center text-xs uppercase tracking-[0.14em] text-text-secondary">
                    {channel.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Commercial EV", "Fleet TCO", "Charging Infra", "Sustainability", "Safety & Compliance"].map((topic, row) => (
                <tr key={topic}>
                  <td className="rounded-lg border border-surface-border bg-white px-3 py-2 font-semibold text-ink">{topic}</td>
                  {channels.map((channel, col) => {
                    const intensity = ((row + 2) * (col + 3) * 11) % 100;
                    const shade = Math.max(8, Math.min(92, intensity));

                    return (
                      <td key={`${topic}-${channel.name}`} className="rounded-lg border border-surface-border px-3 py-2 text-center font-semibold" style={{ background: `hsl(210 85% ${95 - shade * 0.45}%)`, color: "#0f172a" }}>
                        {shade}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
