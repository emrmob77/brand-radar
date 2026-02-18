import { redirect } from "next/navigation";
import { getOnboardingInitialData } from "@/app/activation/actions";
import { AppShell } from "@/components/layout/geo-shell";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function ActivationPage() {
  const initialData = await getOnboardingInitialData();

  if (!initialData) {
    redirect("/login");
  }

  if (initialData.onboardingDone) {
    redirect("/");
  }

  return (
    <AppShell hideSidebar>
      <OnboardingWizard initialData={initialData} />
    </AppShell>
  );
}
