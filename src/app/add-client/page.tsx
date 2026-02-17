"use client";

import { ArrowRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddClientPage() {
  const router = useRouter();

  return (
    <div className="grid-pattern min-h-screen bg-background-dark px-4 py-8 md:px-8">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-surface-border bg-white shadow-panel lg:grid-cols-[320px_1fr]">
        <aside className="border-r border-surface-border bg-sidebar-bg p-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-text-secondary">Onboarding</p>
          <h1 className="mt-3 text-2xl font-extrabold text-ink">Add New Client</h1>
          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-brand/20 bg-brand-soft p-4">
              <p className="text-sm font-semibold text-brand">1. Company Profile</p>
              <p className="mt-1 text-xs text-text-secondary">Collect baseline identity and domain.</p>
            </div>
            <div className="rounded-xl border border-surface-border bg-white p-4">
              <p className="text-sm font-semibold text-ink">2. AI Inventory</p>
              <p className="mt-1 text-xs text-text-secondary">Select channels and tracking scope.</p>
            </div>
          </div>
        </aside>

        <main className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Company Name *</span>
              <input className="focus-ring w-full rounded-xl border border-surface-border px-3 py-2" placeholder="Acme Corporation" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Primary Domain *</span>
              <input className="focus-ring w-full rounded-xl border border-surface-border px-3 py-2" placeholder="https://example.com" />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-ink">Brand Description</span>
              <textarea className="focus-ring h-36 w-full rounded-xl border border-surface-border px-3 py-2" placeholder="Key products, voice, audience, and market claims." />
            </label>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-surface-border pt-6">
            <button className="focus-ring inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-4 py-2 text-sm font-semibold text-ink" onClick={() => router.push("/clients")} type="button">
              <ChevronLeft className="h-4 w-4" />
              Cancel
            </button>
            <button className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600" onClick={() => router.push("/activation")} type="button">
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
