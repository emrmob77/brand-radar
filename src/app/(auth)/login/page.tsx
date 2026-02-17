export default function LoginPage() {
  return (
    <section className="surface-panel p-6 md:p-7">
      <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Brand Radar</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink">Sign In</h1>
      <p className="mt-1 text-sm text-text-secondary">Access your enterprise GEO workspace.</p>

      <form className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Email</span>
          <input className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm" placeholder="name@company.com" type="email" />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Password</span>
          <input className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm" placeholder="••••••••" type="password" />
        </label>

        <button className="focus-ring w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600" type="button">
          Continue
        </button>
      </form>
    </section>
  );
}
