import { cookies } from "next/headers";
import { getMentionPayload } from "@/app/(dashboard)/actions/mentions";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { MentionsAnalytics } from "@/components/mentions/mentions-analytics";

type MentionsPageProps = {
  searchParams?: {
    clientId?: string;
  };
};

export default async function MentionsPage({ searchParams }: MentionsPageProps) {
  const selectedClientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const payload = await getMentionPayload(selectedClientId);
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value ?? null;

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader title="Brand Mentions" description="Real-time mention telemetry, sentiment quality, and narrative pressure by platform." />
      <MentionsAnalytics accessToken={accessToken} analytics={payload.analytics} clientId={selectedClientId} rows={payload.rows} />
    </div>
  );
}
