import Link from "next/link";
import { ArrowRight, BarChart3, Bot, ShieldCheck } from "lucide-react";

const metrics = [
  { label: "Signals Ingested Daily", value: "12.4M+" },
  { label: "Average Alert Latency", value: "92 sec" },
  { label: "Enterprise Teams", value: "230+" }
] as const;

const highlights = [
  {
    icon: Bot,
    title: "AI Visibility Index",
    description: "Measure how often your brand appears across generative answer engines and high-intent prompts."
  },
  {
    icon: ShieldCheck,
    title: "Risk Early Warning",
    description: "Detect citation drift, hallucinated claims, and narrative shifts before they affect stakeholder trust."
  },
  {
    icon: BarChart3,
    title: "Executive Reporting",
    description: "Transform signal noise into board-level summaries with benchmarked trends and action queues."
  }
] as const;

const workflow = [
  {
    title: "Connect",
    detail: "Add your domains, priority entities, and competitors in one onboarding flow."
  },
  {
    title: "Monitor",
    detail: "Track mentions, citation quality, and sentiment trajectory in real time."
  },
  {
    title: "Act",
    detail: "Assign remediation actions and watch benchmark impact from the dashboard."
  }
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8 md:pt-12 lg:px-6">
      <section className="surface-panel relative overflow-hidden rounded-[1.75rem] border border-[#cfd2d8] bg-[#111318] px-5 py-8 text-white sm:px-7 md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-20 -top-16 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-full bg-[linear-gradient(180deg,_rgba(37,99,235,0)_0%,_rgba(37,99,235,0.28)_100%)]" />

        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/70">Corporate GEO Command</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
          Own the answers AI platforms give about your brand.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/78 sm:text-base">
          Brand Radar helps enterprise teams monitor answer-engine visibility, verify source quality, and respond to risk moments before they
          become reputation incidents.
        </p>

        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-ink hover:bg-white/90" href="/register">
            Start Free Trial
          </Link>
          <Link
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
            href="/dashboard"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {metrics.map((item) => (
            <article className="rounded-xl border border-white/15 bg-white/6 px-4 py-3" key={item.label}>
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/72">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {highlights.map((item) => (
          <article className="surface-panel panel-hover rounded-2xl p-5 sm:p-6" key={item.title}>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-brand-soft text-ink">
              <item.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 rounded-3xl border border-surface-border bg-white p-5 sm:p-7 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">How It Works</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">From signal chaos to board-ready action in 3 steps.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
            Build a repeatable GEO operating rhythm. Each workflow stage is designed for cross-functional teams spanning comms, SEO, legal, and
            product marketing.
          </p>
        </div>

        <div className="space-y-3">
          {workflow.map((step, index) => (
            <article className="rounded-2xl border border-surface-border bg-[#fafafb] px-4 py-4" key={step.title}>
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-text-secondary">Step {index + 1}</p>
              <p className="mt-1.5 text-base font-semibold text-ink">{step.title}</p>
              <p className="mt-1.5 text-sm text-text-secondary">{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-surface-border bg-white p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Ready To Launch</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Deploy your GEO control room this week.</h2>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-surface-border bg-white px-4 text-sm font-semibold text-ink hover:bg-brand-soft"
              href="/pricing"
            >
              View Pricing
            </Link>
            <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-600" href="/contact">
              Talk To Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
