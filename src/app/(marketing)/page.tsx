/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  Layers3,
  Radar,
  ShieldCheck,
  Siren,
  Users2
} from "lucide-react";

const heroVisuals = [
  {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1800&q=80",
    alt: "Enterprise analytics dashboard interface",
    label: "Live Signal Command"
  },
  {
    src: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1500&q=80",
    alt: "Cross-functional strategy meeting",
    label: "Cross-Functional Alignment"
  },
  {
    src: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1500&q=80",
    alt: "Executive team reviewing performance reports",
    label: "Executive Narrative Control"
  }
] as const;

const metrics = [
  { label: "Signals Ingested / Day", value: "12.4M+" },
  { label: "Average Alert Latency", value: "92 sec" },
  { label: "Citation Quality Lift", value: "+31%" },
  { label: "Enterprise Programs", value: "230+" }
] as const;

const modules = [
  {
    icon: Radar,
    title: "Visibility Intelligence",
    detail: "Track your answer share across AI platforms by query intent and market segment."
  },
  {
    icon: Bot,
    title: "Narrative Monitoring",
    detail: "Identify how models describe your brand, products, and competitors in real time."
  },
  {
    icon: BarChart3,
    title: "Executive Dashboards",
    detail: "Turn fragmented signals into board-ready summaries with confidence indicators."
  },
  {
    icon: Siren,
    title: "Risk Detection",
    detail: "Detect hallucinations, citation drift, and harmful narrative shifts before escalation."
  },
  {
    icon: Layers3,
    title: "Action Workflows",
    detail: "Convert insights into tracked actions with owners, priorities, and measurable impact."
  },
  {
    icon: ShieldCheck,
    title: "Governance Controls",
    detail: "Support enterprise operations with role-based access and policy-aligned oversight."
  }
] as const;

const workflow = [
  {
    step: "01",
    title: "Connect Your Landscape",
    detail: "Add brands, products, priority entities, and strategic competitors in one setup flow."
  },
  {
    step: "02",
    title: "Monitor Critical Signals",
    detail: "Observe visibility, citation quality, and sentiment trends continuously across target prompts."
  },
  {
    step: "03",
    title: "Prioritize Response",
    detail: "Route high-impact issues into clear remediation plans and assign owners by function."
  },
  {
    step: "04",
    title: "Report Measurable Lift",
    detail: "Present benchmark movement, resolved risk clusters, and business outcomes to leadership."
  }
] as const;

const useCases = [
  {
    icon: Building2,
    title: "Corporate Communications",
    detail: "Protect brand narrative consistency and respond rapidly to misinformation patterns."
  },
  {
    icon: Users2,
    title: "SEO and Growth",
    detail: "Optimize discoverability where generative answers increasingly shape buyer decisions."
  },
  {
    icon: ShieldCheck,
    title: "Legal and Policy Teams",
    detail: "Identify risky claims and enforce governance standards across high-stakes categories."
  },
  {
    icon: Clock3,
    title: "Executive Leadership",
    detail: "Track strategic exposure and decision-ready KPIs without operational noise."
  }
] as const;

const faqs = [
  {
    q: "How quickly can an enterprise team go live?",
    a: "Most teams launch a production-ready workspace within one week, including entity modeling, alert rules, and reporting templates."
  },
  {
    q: "Can we monitor multiple brands or business units?",
    a: "Yes. Brand Radar supports multi-brand and multi-market configurations with shared governance and role-specific visibility."
  },
  {
    q: "How is data quality handled?",
    a: "Signals are validated through source-aware pipelines, confidence scoring, and citation-level auditing controls."
  },
  {
    q: "Do you support regulated industries?",
    a: "Yes. Enterprise plans include governance features and workflow controls designed for regulated and high-compliance environments."
  }
] as const;

const partnerBar = ["Global Motors", "Nova Health", "Aster Finance", "Northline Energy", "Helix Retail"] as const;

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 pt-6 md:pt-10 lg:px-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#2b2f39] bg-[#0e1117] px-5 py-7 text-white sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(255,255,255,0.16),transparent_36%),radial-gradient(circle_at_85%_24%,rgba(37,99,235,0.34),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_44%,rgba(37,99,235,0.18)_100%)]" />

        <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/70">Enterprise GEO Operating System</p>
            <h1 className="mt-3 text-3xl font-semibold leading-[1.08] text-white sm:text-4xl lg:text-[3.2rem]">
              Control how AI platforms represent your brand.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              Brand Radar gives enterprise teams a single control layer to monitor visibility, validate narrative quality, and respond to risk
              before trust is affected.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-ink hover:bg-white/90" href="/register">
                Start Free Trial
              </Link>
              <Link
                className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/8 px-4 text-sm font-semibold text-white hover:bg-white/12"
                href="/dashboard"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {metrics.map((item) => (
                <article className="rounded-xl border border-white/20 bg-white/[0.07] px-3 py-3" key={item.label}>
                  <p className="text-[10px] font-mono uppercase tracking-[0.13em] text-white/65">{item.label}</p>
                  <p className="mt-1.5 text-lg font-semibold text-white">{item.value}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <article className="stagger-in col-span-2 overflow-hidden rounded-2xl border border-white/20">
              <img alt={heroVisuals[0].alt} className="h-52 w-full object-cover sm:h-60" loading="eager" src={heroVisuals[0].src} />
              <div className="bg-[#121620] px-3 py-2 text-xs font-semibold text-white/80">{heroVisuals[0].label}</div>
            </article>
            <article className="stagger-in overflow-hidden rounded-2xl border border-white/20">
              <img alt={heroVisuals[1].alt} className="h-44 w-full object-cover sm:h-48" loading="lazy" src={heroVisuals[1].src} />
              <div className="bg-[#121620] px-3 py-2 text-xs font-semibold text-white/80">{heroVisuals[1].label}</div>
            </article>
            <article className="stagger-in overflow-hidden rounded-2xl border border-white/20">
              <img alt={heroVisuals[2].alt} className="h-44 w-full object-cover sm:h-48" loading="lazy" src={heroVisuals[2].src} />
              <div className="bg-[#121620] px-3 py-2 text-xs font-semibold text-white/80">{heroVisuals[2].label}</div>
            </article>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-surface-border bg-white px-4 py-4">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Trusted by teams in enterprise and regulated industries</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {partnerBar.map((brand) => (
            <div className="rounded-lg border border-surface-border bg-[#fafafb] px-3 py-2 text-center text-sm font-semibold text-ink" key={brand}>
              {brand}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="max-w-2xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Platform Modules</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">Everything required to run a serious GEO operation.</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <article className="surface-panel panel-hover rounded-2xl p-5 sm:p-6" key={item.title}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-brand-soft text-ink">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-surface-border bg-white p-5 sm:p-7">
        <div className="max-w-2xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Operating Workflow</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">From fragmented signals to measurable leadership outcomes.</h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {workflow.map((item) => (
            <article className="rounded-2xl border border-surface-border bg-[#fafafb] px-4 py-4 sm:px-5" key={item.step}>
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-text-secondary">Step {item.step}</p>
              <p className="mt-1.5 text-lg font-semibold text-ink">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1fr]">
        <article className="rounded-3xl border border-surface-border bg-white p-5 sm:p-7">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Team Use Cases</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">Built for cross-functional execution.</h2>
          <div className="mt-4 space-y-3">
            {useCases.map((item) => (
              <div className="rounded-2xl border border-surface-border bg-[#fafafb] px-4 py-3" key={item.title}>
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-ink" />
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-surface-border bg-[#0f1219] text-white">
          <img
            alt="Business strategy and analytics visualization"
            className="h-56 w-full object-cover sm:h-72 lg:h-full"
            loading="lazy"
            src="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1700&q=80"
          />
          <div className="border-t border-white/10 p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">Live Risk Narrative</p>
            <p className="mt-1.5 text-sm text-white/85">
              Priority alert: sustainability confidence dropped by 8% in 24 hours due to low-authority references.
            </p>
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-3xl border border-surface-border bg-white p-5 sm:p-7">
        <div className="max-w-2xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Frequently Asked Questions</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">Key questions from enterprise teams.</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {faqs.map((item) => (
            <article className="rounded-2xl border border-surface-border bg-[#fafafb] px-4 py-4" key={item.q}>
              <p className="text-sm font-semibold text-ink">{item.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-surface-border bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Next Step</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Launch your GEO command center this week.</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
              Start with a guided trial, configure your first monitoring blueprint, and align all teams around one source of truth.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-surface-border bg-white px-4 text-sm font-semibold text-ink hover:bg-brand-soft"
              href="/pricing"
            >
              View Pricing
            </Link>
            <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-600" href="/contact">
              Talk to Sales
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-[#fafafb] px-3 py-2 text-sm text-ink">
            <CheckCircle2 className="h-4 w-4 text-healthy" />
            <span>Fast enterprise onboarding</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-[#fafafb] px-3 py-2 text-sm text-ink">
            <CheckCircle2 className="h-4 w-4 text-healthy" />
            <span>Role-based collaboration</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-[#fafafb] px-3 py-2 text-sm text-ink">
            <CheckCircle2 className="h-4 w-4 text-healthy" />
            <span>Measurable strategic lift</span>
          </div>
        </div>
      </section>
    </div>
  );
}
