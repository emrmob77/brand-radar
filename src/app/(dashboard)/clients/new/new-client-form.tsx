"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createClientAction, initialNewClientFormState } from "@/app/(dashboard)/clients/new/actions";

type PlatformOption = {
  id: string;
  name: string;
  slug: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="focus-ring inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Create Client"}
    </button>
  );
}

export function NewClientForm({ platforms }: { platforms: PlatformOption[] }) {
  const [state, formAction] = useFormState(createClientAction, initialNewClientFormState);

  return (
    <form action={formAction} className="surface-panel p-6 md:p-7">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Client Name *</span>
          <input
            className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2"
            name="name"
            placeholder="Acme Corporation"
            required
            type="text"
          />
          {state.fieldErrors?.name ? <span className="mt-1 block text-xs text-critical">{state.fieldErrors.name}</span> : null}
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Domain *</span>
          <input
            className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2"
            name="domain"
            placeholder="example.com"
            required
            type="text"
          />
          {state.fieldErrors?.domain ? <span className="mt-1 block text-xs text-critical">{state.fieldErrors.domain}</span> : null}
        </label>

        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-ink">Industry *</span>
          <input
            className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2"
            name="industry"
            placeholder="Automotive"
            required
            type="text"
          />
          {state.fieldErrors?.industry ? <span className="mt-1 block text-xs text-critical">{state.fieldErrors.industry}</span> : null}
        </label>

        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-ink">Logo</span>
          <input
            accept="image/*"
            className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm"
            name="logo"
            type="file"
          />
        </label>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-ink">Aktif Platformlar *</legend>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {platforms.map((platform) => (
            <label className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink" key={platform.id}>
              <input className="h-4 w-4 rounded border-surface-border" name="platformSlugs" type="checkbox" value={platform.slug} />
              <span>{platform.name}</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.platformSlugs ? <span className="mt-2 block text-xs text-critical">{state.fieldErrors.platformSlugs}</span> : null}
      </fieldset>

      {state.error ? (
        <p aria-live="polite" className="mt-4 rounded-xl border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
          {state.error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
