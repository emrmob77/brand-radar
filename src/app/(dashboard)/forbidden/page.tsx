import Link from "next/link";
import { DashboardHeader } from "@/components/layout/geo-shell";

type ForbiddenPageProps = {
  searchParams?: {
    reason?: string;
    from?: string;
  };
};

function resolveMessage(reason: string | undefined) {
  if (reason === "admin_required") {
    return "This page requires an admin role. Contact your workspace administrator if you need access.";
  }

  if (reason === "viewer_read_only") {
    return "Your current role is read-only. This action is limited to editor and admin roles.";
  }

  return "You do not have permission to access this resource.";
}

export default function ForbiddenPage({ searchParams }: ForbiddenPageProps) {
  const message = resolveMessage(searchParams?.reason);
  const from = searchParams?.from ? decodeURIComponent(searchParams.from) : "/dashboard";

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader title="Access Restricted" description="Role-based access control blocked this request." />

      <section className="surface-panel p-6">
        <p className="text-sm text-text-secondary">{message}</p>
        <p className="mt-2 text-xs text-text-secondary">
          Requested path: <span className="font-semibold text-ink">{from}</span>
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="focus-ring rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600" href="/dashboard">
            Go to Dashboard
          </Link>
          <Link className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft" href="/settings">
            Open Settings
          </Link>
        </div>
      </section>
    </div>
  );
}
