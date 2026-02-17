import { getHistoricalTrendsPayload, type TrendGranularity } from "@/app/(dashboard)/actions/historical-trends";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { HistoricalTrendsDashboard } from "@/components/trends/historical-trends-dashboard";

type TrendsPageProps = {
  searchParams?: {
    clientId?: string;
    from?: string;
    to?: string;
    compareFrom?: string;
    compareTo?: string;
    granularity?: string;
  };
};

function normalizeGranularity(input: string | undefined): TrendGranularity {
  if (input === "weekly" || input === "monthly") return input;
  return "daily";
}

export default async function TrendsPage({ searchParams }: TrendsPageProps) {
  const clientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const payload = await getHistoricalTrendsPayload({
    clientId,
    from: typeof searchParams?.from === "string" ? searchParams.from : undefined,
    to: typeof searchParams?.to === "string" ? searchParams.to : undefined,
    compareFrom: typeof searchParams?.compareFrom === "string" ? searchParams.compareFrom : undefined,
    compareTo: typeof searchParams?.compareTo === "string" ? searchParams.compareTo : undefined,
    granularity: normalizeGranularity(typeof searchParams?.granularity === "string" ? searchParams.granularity : undefined)
  });

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Historical Trends"
        description="Calendar heatmap, date-range comparison, moving averages, and daily/weekly/monthly aggregation."
      />

      {!clientId ? (
        <section className="surface-panel mb-4 p-4 text-sm text-text-secondary">
          Select a client to load historical trend data. Preview mode is currently active.
        </section>
      ) : null}

      <HistoricalTrendsDashboard clientId={clientId} payload={payload} />
    </div>
  );
}
