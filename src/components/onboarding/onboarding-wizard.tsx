"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { OnboardingInitialData } from "@/app/activation/actions";
import { completeOnboardingAction, skipOnboardingAction } from "@/app/activation/actions";
import { HelpTooltip } from "@/components/help/help-tooltip";

type OnboardingWizardProps = {
  initialData: OnboardingInitialData;
};

const totalSteps = 3;

export function OnboardingWizard({ initialData }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(initialData.userFullName);
  const [agencyName, setAgencyName] = useState(initialData.agencyName);
  const [useExistingClient, setUseExistingClient] = useState(initialData.clients.length > 0);
  const [existingClientId, setExistingClientId] = useState(initialData.clients[0]?.id ?? "");
  const [clientName, setClientName] = useState("");
  const [clientDomain, setClientDomain] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [selectedPlatformSlugs, setSelectedPlatformSlugs] = useState<string[]>(
    initialData.platforms.slice(0, 2).map((platform) => platform.slug)
  );
  const [firstQueryText, setFirstQueryText] = useState("best enterprise visibility strategy for b2b brand");
  const [firstQueryCategory, setFirstQueryCategory] = useState("brand-positioning");

  const progress = useMemo(() => Math.round((step / totalSteps) * 100), [step]);

  function togglePlatform(slug: string) {
    setSelectedPlatformSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.length > 1 ? prev.filter((item) => item !== slug) : prev;
      }
      return [...prev, slug];
    });
  }

  function nextStep() {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
      setError(null);
    }
  }

  function previousStep() {
    if (step > 1) {
      setStep((prev) => prev - 1);
      setError(null);
    }
  }

  function handleSkip() {
    startTransition(async () => {
      const result = await skipOnboardingAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.redirectTo);
      router.refresh();
    });
  }

  function handleComplete() {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboardingAction({
        fullName,
        agencyName,
        useExistingClient,
        existingClientId: useExistingClient ? existingClientId || null : null,
        clientName: useExistingClient ? undefined : clientName,
        clientDomain: useExistingClient ? undefined : clientDomain,
        clientIndustry: useExistingClient ? undefined : clientIndustry,
        selectedPlatformSlugs,
        firstQueryText,
        firstQueryCategory
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(result.redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <section className="surface-panel p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Onboarding Wizard</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Launch Your Workspace</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Complete setup once to unlock client tracking, platform visibility, and first query monitoring.
            </p>
          </div>
          <button
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-text-secondary hover:text-ink"
            disabled={isPending}
            onClick={handleSkip}
            type="button"
          >
            <SkipForward className="h-4 w-4" />
            Skip for now
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-surface-border bg-brand-soft/35 p-3">
          <div className="flex items-center justify-between text-xs">
            <p className="font-semibold text-ink">
              Step {step} / {totalSteps}
            </p>
            <p className="text-text-secondary">{progress}% completed</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white">
            <div className="h-2 rounded-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {step === 1 ? (
          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 flex items-center gap-2 font-medium text-ink">
                Your Name
                <HelpTooltip text="Used in invites, audit logs, and ownership records." />
              </span>
              <input
                className="focus-ring min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2"
                onChange={(event) => setFullName(event.target.value)}
                type="text"
                value={fullName}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 flex items-center gap-2 font-medium text-ink">
                Agency Name
                <HelpTooltip text="Shown in white-label branding, reports, and email templates." />
              </span>
              <input
                className="focus-ring min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2"
                onChange={(event) => setAgencyName(event.target.value)}
                type="text"
                value={agencyName}
              />
            </label>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                className={`focus-ring min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  useExistingClient ? "border-brand/35 bg-brand-soft text-ink" : "border-surface-border bg-white text-text-secondary"
                }`}
                onClick={() => setUseExistingClient(true)}
                type="button"
              >
                Use Existing Client
              </button>
              <button
                className={`focus-ring min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  !useExistingClient ? "border-brand/35 bg-brand-soft text-ink" : "border-surface-border bg-white text-text-secondary"
                }`}
                onClick={() => setUseExistingClient(false)}
                type="button"
              >
                Create New Client
              </button>
            </div>

            {useExistingClient ? (
              <label className="text-sm">
                <span className="mb-1 flex items-center gap-2 font-medium text-ink">
                  Client
                  <HelpTooltip text="Select a client to configure initial platforms and first query." />
                </span>
                <select
                  className="focus-ring min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2"
                  onChange={(event) => setExistingClientId(event.target.value)}
                  value={existingClientId}
                >
                  {initialData.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.domain})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Client Name</span>
                  <input
                    className="focus-ring min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2"
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="Acme Corp"
                    type="text"
                    value={clientName}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Client Domain</span>
                  <input
                    className="focus-ring min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2"
                    onChange={(event) => setClientDomain(event.target.value)}
                    placeholder="acme.com"
                    type="text"
                    value={clientDomain}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Industry</span>
                  <input
                    className="focus-ring min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2"
                    onChange={(event) => setClientIndustry(event.target.value)}
                    placeholder="SaaS"
                    type="text"
                    value={clientIndustry}
                  />
                </label>
              </div>
            )}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="mt-6 space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">Platform Configuration</p>
                <HelpTooltip text="At least one AI platform must be tracked to start visibility monitoring." />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {initialData.platforms.map((platform) => {
                  const checked = selectedPlatformSlugs.includes(platform.slug);
                  return (
                    <label
                      className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        checked ? "border-brand/35 bg-brand-soft text-ink" : "border-surface-border bg-white text-text-secondary"
                      }`}
                      key={platform.id}
                    >
                      <input checked={checked} onChange={() => togglePlatform(platform.slug)} type="checkbox" />
                      <span>{platform.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="text-sm">
              <span className="mb-1 flex items-center gap-2 font-medium text-ink">
                First Query
                <HelpTooltip text="Seed one high-intent query to begin mention and citation collection." />
              </span>
              <textarea
                className="focus-ring min-h-[92px] w-full rounded-xl border border-surface-border bg-white px-3 py-2"
                onChange={(event) => setFirstQueryText(event.target.value)}
                value={firstQueryText}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Query Category</span>
              <input
                className="focus-ring min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2"
                onChange={(event) => setFirstQueryCategory(event.target.value)}
                value={firstQueryCategory}
              />
            </label>
          </section>
        ) : null}

        {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-sm font-semibold text-text-secondary disabled:cursor-not-allowed disabled:opacity-55"
            disabled={step === 1 || isPending}
            onClick={previousStep}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {step < totalSteps ? (
            <button
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              onClick={nextStep}
              type="button"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={handleComplete}
              type="button"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isPending ? "Finalizing..." : "Finish Onboarding"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
