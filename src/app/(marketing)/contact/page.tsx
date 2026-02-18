import Link from "next/link";

const channels = [
  {
    title: "Sales",
    value: "sales@brandradar.ai",
    description: "Platform walkthroughs, procurement support, and pricing consultations."
  },
  {
    title: "Support",
    value: "support@brandradar.ai",
    description: "Workspace setup, onboarding help, and implementation guidance."
  },
  {
    title: "Partnerships",
    value: "partners@brandradar.ai",
    description: "Agency programs, integrations, and ecosystem collaborations."
  }
] as const;

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8 md:pt-12 lg:px-6">
      <section className="rounded-3xl border border-surface-border bg-white p-6 sm:p-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Contact</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Talk to the Brand Radar team.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Share your priorities and we will help you map a practical GEO operating model for your organization.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="surface-panel rounded-2xl p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-ink">Send a Request</h2>
          <form className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm text-text-secondary">
                Full Name
                <input className="focus-ring mt-1 block min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink" name="name" type="text" />
              </label>
              <label className="text-sm text-text-secondary">
                Work Email
                <input className="focus-ring mt-1 block min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink" name="email" type="email" />
              </label>
            </div>

            <label className="block text-sm text-text-secondary">
              Company
              <input className="focus-ring mt-1 block min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink" name="company" type="text" />
            </label>

            <label className="block text-sm text-text-secondary">
              Message
              <textarea
                className="focus-ring mt-1 block min-h-[7.5rem] w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink"
                name="message"
              />
            </label>

            <button className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-600" type="button">
              Send Message
            </button>
          </form>
        </article>

        <div className="space-y-3">
          {channels.map((item) => (
            <article className="surface-panel rounded-2xl p-4" key={item.title}>
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-secondary">{item.title}</p>
              <Link className="mt-2 inline-block text-base font-semibold text-ink hover:underline" href={`mailto:${item.value}`}>
                {item.value}
              </Link>
              <p className="mt-2 text-sm text-text-secondary">{item.description}</p>
            </article>
          ))}
          <article className="rounded-2xl border border-surface-border bg-white p-4">
            <p className="text-sm text-text-secondary">Already have an account?</p>
            <Link className="focus-ring mt-3 inline-flex min-h-11 items-center rounded-xl border border-surface-border bg-white px-4 text-sm font-semibold text-ink hover:bg-brand-soft" href="/dashboard">
              Open Dashboard
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
