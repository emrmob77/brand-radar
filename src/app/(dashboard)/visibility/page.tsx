import { getPlatformTopicHeatmapPayload, getPlatformVisibility } from "@/app/(dashboard)/actions/ai-visibility";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { PlatformTopicHeatmap } from "@/components/visibility/platform-topic-heatmap";

type VisibilityPageProps = {
  searchParams?: {
    clientId?: string;
  };
};

export default async function VisibilityPage({ searchParams }: VisibilityPageProps) {
  const selectedClientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const [channels, heatmapPayload] = await Promise.all([
    getPlatformVisibility(selectedClientId),
    getPlatformTopicHeatmapPayload(selectedClientId)
  ]);
  const rankedChannels = [...channels].sort((a, b) => b.share - a.share);
  const topPlatformSlugs = new Set(rankedChannels.slice(0, 2).map((channel) => channel.slug));

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="AI Visibility Matrix"
        description="Platform-level share of voice and category penetration across strategic query clusters."
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {channels.length === 0 ? (
          <article className="surface-panel col-span-full p-4 text-sm text-text-secondary">
            No visibility data found. Check selected client and mention records.
          </article>
        ) : (
          channels.map((channel) => (
            <article key={channel.slug} className="surface-panel p-4">
              <p className="text-sm font-semibold text-ink">{channel.name}</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{channel.share.toFixed(1)}%</p>
              <p className={`mt-1 text-xs font-semibold ${channel.delta >= 0 ? "text-brand" : "text-critical"}`}>
                {`${channel.delta >= 0 ? "+" : ""}${channel.delta.toFixed(1)} pts`}
              </p>
              <p className="mt-1 text-[11px] text-text-secondary">{channel.mentions} mentions</p>
            </article>
          ))
        )}
      </section>

      <section className="mt-6 surface-panel p-6">
        <h2 className="text-lg font-bold text-ink">Platform x Topic Heatmap</h2>
        <p className="mt-1 text-sm text-text-secondary">Relative dominance across high-intent topic categories</p>
        <PlatformTopicHeatmap payload={heatmapPayload} />
      </section>

      <section className="mt-6 surface-panel p-6">
        <h2 className="text-lg font-bold text-ink">Share of Voice Comparison</h2>
        <p className="mt-1 text-sm text-text-secondary">Cross-platform SoV ranking with top performer highlights.</p>

        <div className="mt-5 space-y-3">
          {rankedChannels.map((channel) => (
            <div className="rounded-xl border border-surface-border bg-white p-3" key={channel.slug}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${topPlatformSlugs.has(channel.slug) ? "bg-brand" : "bg-slate-300"}`} />
                  <span className="font-semibold text-ink">{channel.name}</span>
                  {topPlatformSlugs.has(channel.slug) ? (
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">Top</span>
                  ) : null}
                </div>
                <span className="font-mono text-text-secondary">{channel.share.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-brand-soft">
                <div
                  className={`h-2 rounded-full ${topPlatformSlugs.has(channel.slug) ? "bg-brand" : "bg-slate-500"}`}
                  style={{ width: `${Math.max(2, channel.share)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
