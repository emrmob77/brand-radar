import Link from "next/link";
import { AlertTriangle, FileSearch, Gauge, Sparkles } from "lucide-react";

const featureGroups = [
  {
    icon: Gauge,
    title: "Visibility Monitoring",
    description: "Track platform-level answer share, query momentum, and trend acceleration.",
    bullets: ["Cross-platform coverage", "Topic heatmaps", "Historical trend comparisons"]
  },
  {
    icon: FileSearch,
    title: "Citation Intelligence",
    description: "Audit source quality and discover which references shape AI answers.",
    bullets: ["Citation route analysis", "Low-trust source alerts", "Forensics timeline"]
  },
  {
    icon: AlertTriangle,
    title: "Reputation Risk Control",
    description: "Catch factual drift, misleading claims, and confidence decay patterns.",
    bullets: ["Risk scoring", "Hallucination workbench", "Alert center workflows"]
  },
  {
    icon: Sparkles,
    title: "Optimization Workspace",
    description: "Prioritize fixes with impact scores and monitor post-action lift.",
    bullets: ["Impact vs effort matrix", "Action board states", "Executive-ready summaries"]
  }
] as const;

export default function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8 md:pt-12 lg:px-6">
      <section className="rounded-3xl border border-surface-border bg-white p-6 sm:p-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Features</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold text-ink sm:text-4xl">A complete operating system for GEO intelligence.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Build shared visibility across SEO, communications, product marketing, and policy teams with one command center.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {featureGroups.map((group) => (
          <article className="surface-panel panel-hover rounded-2xl p-5 sm:p-6" key={group.title}>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-brand-soft text-ink">
              <group.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-ink">{group.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{group.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              {group.bullets.map((item) => (
                <li className="rounded-xl border border-surface-border bg-[#fafafb] px-3 py-2" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border border-surface-border bg-[#111318] p-6 text-white sm:p-8">
        <h2 className="text-2xl font-semibold">See all modules in your own workspace.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
          Launch a live environment and explore dashboards, alerts, and optimization boards with your own entities.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-ink hover:bg-white/90" href="/register">
            Start Trial
          </Link>
          <Link
            className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
            href="/dashboard"
          >
            Open Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
