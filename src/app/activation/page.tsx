"use client";

import { CheckCircle2, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/geo-shell";
import { useRouter } from "next/navigation";

export default function ActivationPage() {
  const router = useRouter();

  return (
    <AppShell hideSidebar>
      <div className="mx-auto w-full max-w-4xl">
        <section className="surface-panel p-6 md:p-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-text-secondary">Final Review</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Activation Checkpoint</h1>
          <p className="mt-2 text-sm text-text-secondary">Validate company context and launch tracking channels.</p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-surface-border bg-white p-4">
              <h2 className="text-sm font-bold text-ink">Company Profile</h2>
              <p className="mt-3 text-sm text-text-secondary">Entity: Global Tech Corp (GTC-AI)</p>
              <p className="mt-1 text-sm text-text-secondary">Domain: www.globaltech.ai</p>
            </article>

            <article className="rounded-2xl border border-surface-border bg-white p-4">
              <h2 className="text-sm font-bold text-ink">Engine Status</h2>
              <div className="mt-3 space-y-2">
                {["ChatGPT", "Perplexity", "Google AI", "Claude"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl border border-surface-border px-3 py-2">
                    <p className="text-sm font-medium text-ink">{item}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-surface-border pt-6">
            <button className="focus-ring inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-4 py-2 text-sm font-semibold text-ink" onClick={() => router.back()} type="button">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button className="focus-ring rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600" onClick={() => router.push("/")} type="button">
              Activate Workspace
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
