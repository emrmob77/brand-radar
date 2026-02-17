"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createCompetitorAction, initialCompetitorFormState } from "@/app/(dashboard)/competitors/new/actions";

type NewCompetitorFormProps = {
  clientId: string | null;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="focus-ring inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Saving..." : "Save Competitor"}
    </button>
  );
}

export function NewCompetitorForm({ clientId }: NewCompetitorFormProps) {
  const [state, formAction] = useFormState(createCompetitorAction, initialCompetitorFormState);

  return (
    <form action={formAction} className="surface-panel p-6 md:p-7">
      <input name="clientId" type="hidden" value={clientId ?? ""} />

      <div className="grid grid-cols-1 gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Competitor Name *</span>
          <input
            className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2"
            name="name"
            placeholder="Competitor Inc."
            required
            type="text"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Domain *</span>
          <input
            className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2"
            name="domain"
            placeholder="competitor.com"
            required
            type="text"
          />
        </label>
      </div>

      {!clientId ? (
        <p className="mt-4 rounded-xl border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
          You must select a client first to add a competitor.
        </p>
      ) : null}

      {state.error ? (
        <p aria-live="polite" className="mt-4 rounded-xl border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
          {state.error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <SubmitButton disabled={!clientId} />
      </div>
    </form>
  );
}
