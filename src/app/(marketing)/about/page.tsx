const principles = [
  {
    title: "Evidence First",
    detail: "Every insight is tied to sources so teams can verify claims before taking action."
  },
  {
    title: "Speed With Governance",
    detail: "Fast signal detection is matched with role-based controls for enterprise-grade accountability."
  },
  {
    title: "Cross-Functional By Design",
    detail: "GEO requires collaboration across SEO, communications, legal, and product marketing teams."
  }
] as const;

const team = [
  { name: "Platform Intelligence", focus: "Model behavior analytics and benchmark design." },
  { name: "Trust Engineering", focus: "Citation quality, policy workflows, and risk controls." },
  { name: "Customer Operations", focus: "Activation playbooks and enterprise onboarding support." }
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8 md:pt-12 lg:px-6">
      <section className="rounded-3xl border border-surface-border bg-white p-6 sm:p-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">About</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold text-ink sm:text-4xl">We build decision systems for the AI answer era.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Brand Radar was founded to help organizations manage how they are represented in generative platforms, where visibility and trust now
          shape purchasing decisions.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="surface-panel rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-ink">Our Mission</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Give teams a precise operating model for answer-engine optimization, so they can protect narrative accuracy and expand trusted
            discovery in competitive categories.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            We focus on measurable outcomes: improved mention share, stronger source quality, and faster incident response time.
          </p>
        </article>
        <article className="surface-panel rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-ink">Headquarters</h2>
          <p className="mt-3 text-sm text-text-secondary">Istanbul, TR</p>
          <p className="mt-1 text-sm text-text-secondary">Global operations for EMEA and North America teams.</p>
        </article>
      </section>

      <section className="mt-6 rounded-3xl border border-surface-border bg-white p-5 sm:p-7">
        <h2 className="text-2xl font-semibold text-ink">Principles</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {principles.map((item) => (
            <article className="rounded-2xl border border-surface-border bg-[#fafafb] px-4 py-4" key={item.title}>
              <p className="text-base font-semibold text-ink">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-surface-border bg-white p-5 sm:p-7">
        <h2 className="text-2xl font-semibold text-ink">Teams</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {team.map((item) => (
            <article className="rounded-2xl border border-surface-border bg-[#fafafb] px-4 py-4" key={item.name}>
              <p className="text-sm font-semibold text-ink">{item.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.focus}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
