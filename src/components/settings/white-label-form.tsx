"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  initialWhiteLabelFormState,
  updateWhiteLabelAction
} from "@/app/(dashboard)/settings/white-label/actions";

type WhiteLabelFormProps = {
  agency: {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
  };
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Save Branding"}
    </button>
  );
}

export function WhiteLabelForm({ agency }: WhiteLabelFormProps) {
  const [state, formAction] = useFormState(updateWhiteLabelAction, initialWhiteLabelFormState);

  return (
    <form action={formAction} className="surface-panel p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-ink">Company Name</span>
          <input
            className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink"
            defaultValue={agency.name}
            name="companyName"
            required
            type="text"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Primary Color</span>
          <div className="rounded-xl border border-surface-border bg-white px-3 py-2">
            <input className="h-10 w-full rounded border border-surface-border" defaultValue={agency.primaryColor} name="primaryColor" type="color" />
            <p className="mt-1 text-xs text-text-secondary">{agency.primaryColor}</p>
          </div>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Secondary Color</span>
          <div className="rounded-xl border border-surface-border bg-white px-3 py-2">
            <input className="h-10 w-full rounded border border-surface-border" defaultValue={agency.secondaryColor} name="secondaryColor" type="color" />
            <p className="mt-1 text-xs text-text-secondary">{agency.secondaryColor}</p>
          </div>
        </label>

        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-ink">Agency Logo</span>
          <input accept="image/*" className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink" name="logo" type="file" />
        </label>
      </div>

      {agency.logoUrl ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-text-secondary">Current Logo</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Agency logo" className="mt-2 h-14 w-14 rounded-xl border border-surface-border object-cover" src={agency.logoUrl} />
        </div>
      ) : null}

      {state.error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
