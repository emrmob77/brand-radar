"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { logClientError } from "@/lib/monitoring/error-logger";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    void logClientError(error, {
      area: "app/error-boundary",
      metadata: {
        digest: error.digest ?? null,
        pathname: typeof window !== "undefined" ? window.location.pathname : null
      }
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-4">
      <section className="surface-panel w-full p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-red-200 bg-red-50 text-red-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm text-text-secondary">An unexpected error occurred. You can retry or return to the dashboard.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            onClick={reset}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
          <Link
            className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-surface-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-soft"
            href="/dashboard"
          >
            Go Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
