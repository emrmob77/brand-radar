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
    customDomain: string | null;
  };
  dnsTarget: string;
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

export function WhiteLabelForm({ agency, dnsTarget }: WhiteLabelFormProps) {
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
          {state.fieldErrors?.companyName ? <span className="mt-1 block text-xs text-critical">{state.fieldErrors.companyName}</span> : null}
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Primary Color</span>
          <div className="rounded-xl border border-surface-border bg-white px-3 py-2">
            <input className="h-10 w-full rounded border border-surface-border" defaultValue={agency.primaryColor} name="primaryColor" type="color" />
            <p className="mt-1 text-xs text-text-secondary">{agency.primaryColor}</p>
          </div>
          {state.fieldErrors?.primaryColor ? <span className="mt-1 block text-xs text-critical">{state.fieldErrors.primaryColor}</span> : null}
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Secondary Color</span>
          <div className="rounded-xl border border-surface-border bg-white px-3 py-2">
            <input className="h-10 w-full rounded border border-surface-border" defaultValue={agency.secondaryColor} name="secondaryColor" type="color" />
            <p className="mt-1 text-xs text-text-secondary">{agency.secondaryColor}</p>
          </div>
          {state.fieldErrors?.secondaryColor ? <span className="mt-1 block text-xs text-critical">{state.fieldErrors.secondaryColor}</span> : null}
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

      <div className="mt-6 rounded-2xl border border-surface-border bg-brand-soft/40 p-4">
        <p className="text-sm font-semibold text-ink">Custom Domain</p>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          Use a branded subdomain for client access. Example: <span className="font-mono text-ink">geo.youragency.com</span>. Leave empty to disable custom domain routing.
        </p>

        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium text-ink">Custom Domain Hostname</span>
          <input
            className="focus-ring min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink placeholder:text-text-secondary"
            defaultValue={agency.customDomain ?? ""}
            name="customDomain"
            placeholder="geo.youragency.com"
            type="text"
          />
          {state.fieldErrors?.customDomain ? <span className="mt-1 block text-xs text-critical">{state.fieldErrors.customDomain}</span> : null}
        </label>

        <div className="mt-4 rounded-xl border border-surface-border bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">DNS Setup</p>
          <ol className="mt-2 space-y-1.5 text-xs text-text-secondary">
            <li>1. DNS provider panelinde bir `CNAME` kaydı oluşturun.</li>
            <li>
              2. Host/Name alanına kullanmak istediğiniz subdomaini girin (örnek: <span className="font-mono text-ink">geo</span>).
            </li>
            <li>
              3. Target/Value alanını <span className="font-mono text-ink">{dnsTarget}</span> olarak ayarlayın.
            </li>
            <li>4. TTL değerini `Auto` bırakın ve DNS yayılımını bekleyin.</li>
          </ol>
        </div>
      </div>

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
