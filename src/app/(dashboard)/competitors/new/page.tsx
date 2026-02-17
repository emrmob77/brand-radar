import Link from "next/link";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { NewCompetitorForm } from "@/app/(dashboard)/competitors/new/new-competitor-form";

type NewCompetitorPageProps = {
  searchParams?: {
    clientId?: string;
  };
};

export default function NewCompetitorPage({ searchParams }: NewCompetitorPageProps) {
  const clientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const backHref = clientId ? `/competitors?clientId=${encodeURIComponent(clientId)}` : "/competitors";

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        actions={
          <Link className="focus-ring inline-flex items-center rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft" href={backHref}>
            Back to Competitors
          </Link>
        }
        description="Add a new competitor domain to monitor visibility and citation pressure."
        title="Add Competitor"
      />
      <NewCompetitorForm clientId={clientId} />
    </div>
  );
}
