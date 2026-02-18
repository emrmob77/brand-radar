import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { WhiteLabelForm } from "@/components/settings/white-label-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function resolveDnsTarget() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    return "app.brandradar.ai";
  }

  try {
    return new URL(appUrl).hostname;
  } catch {
    return appUrl.replace(/^https?:\/\//, "").split("/")[0] || "app.brandradar.ai";
  }
}

async function getAgencyBranding(accessToken: string, agencyId: string) {
  const supabase = createServerSupabaseClient(accessToken);
  const { data } = await supabase
    .from("agencies")
    .select("name,logo_url,primary_color,secondary_color,custom_domain")
    .eq("id", agencyId)
    .maybeSingle();

  return {
    name: data?.name ?? "Agency",
    logoUrl: data?.logo_url ?? null,
    primaryColor: data?.primary_color ?? "#376df6",
    secondaryColor: data?.secondary_color ?? "#2563eb",
    customDomain: data?.custom_domain ?? null
  };
}

export default async function WhiteLabelSettingsPage() {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  const currentUser = await getCurrentUser(accessToken);

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "admin") {
    redirect("/forbidden?reason=admin_required&from=%2Fsettings%2Fwhite-label");
  }

  const agency = await getAgencyBranding(accessToken ?? "", currentUser.agencyId);
  const dnsTarget = resolveDnsTarget();

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="White-Label Configuration"
        description="Configure agency logo, primary color, secondary color, and company name."
      />
      <WhiteLabelForm agency={agency} dnsTarget={dnsTarget} />
    </div>
  );
}
