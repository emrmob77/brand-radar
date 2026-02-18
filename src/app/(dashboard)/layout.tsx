import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppShell } from "@/components/layout/geo-shell";
import type { BrandingConfig } from "@/components/providers/branding-provider";
import { shouldRunOnboarding } from "@/lib/onboarding/flow";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const defaultBranding: BrandingConfig = {
  companyName: "Brand Radar",
  logoUrl: null,
  primaryColor: "#171a20",
  secondaryColor: "#2563eb"
};

async function getDashboardClients(accessToken: string | null) {
  if (!accessToken) {
    return [];
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.from("clients").select("id,name,domain").order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

async function getAgencyBranding(accessToken: string | null, agencyId: string | null): Promise<BrandingConfig> {
  if (!accessToken || !agencyId) {
    return defaultBranding;
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("agencies")
    .select("name,logo_url,primary_color,secondary_color")
    .eq("id", agencyId)
    .maybeSingle();

  if (error || !data) {
    return defaultBranding;
  }

  return {
    companyName: data.name ?? defaultBranding.companyName,
    logoUrl: data.logo_url ?? null,
    primaryColor: data.primary_color ?? defaultBranding.primaryColor,
    secondaryColor: data.secondary_color ?? defaultBranding.secondaryColor
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const currentUser = await getCurrentUser(accessToken);
  const [clients, branding] = await Promise.all([
    getDashboardClients(accessToken),
    getAgencyBranding(accessToken, currentUser?.agencyId ?? null)
  ]);
  const shouldStartOnboarding = Boolean(currentUser)
    ? shouldRunOnboarding({
        onboardingCompletedAt: currentUser?.onboardingCompletedAt ?? null,
        onboardingSkippedAt: currentUser?.onboardingSkippedAt ?? null,
        clientCount: clients.length
      })
    : false;

  if (shouldStartOnboarding) {
    redirect("/activation");
  }

  return (
    <AppShell accessToken={accessToken} branding={branding} clients={clients}>
      {children}
    </AppShell>
  );
}
