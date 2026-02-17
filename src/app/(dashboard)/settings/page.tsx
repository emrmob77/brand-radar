import { DashboardHeader } from "@/components/layout/geo-shell";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader title="Workspace Settings" description="Manage company profile, integrations, and operational safeguards." />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="surface-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-ink">Company Profile</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Company Name</span>
              <input className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm" defaultValue="Global Motors Inc." />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Industry</span>
              <input className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm" defaultValue="Automotive & Mobility" />
            </label>
          </div>

          <h3 className="mt-6 text-base font-bold text-ink">Platform Integrations</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {["ChatGPT", "Perplexity", "Claude", "Google AI"].map((item) => (
              <div key={item} className="rounded-xl border border-surface-border bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{item}</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Connected</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="surface-panel p-6">
          <h2 className="text-base font-bold text-ink">Danger Zone</h2>
          <p className="mt-2 text-sm text-text-secondary">Permanent actions require admin-level approval.</p>
          <button className="focus-ring mt-4 w-full rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100" type="button">
            Archive Client Data
          </button>
        </aside>
      </section>
    </div>
  );
}
