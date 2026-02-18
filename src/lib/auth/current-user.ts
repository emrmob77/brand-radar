import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppUserRole = "admin" | "editor" | "viewer";

export type CurrentUser = {
  id: string;
  agencyId: string;
  email: string;
  fullName: string;
  role: AppUserRole;
  onboardingCompletedAt: string | null;
  onboardingSkippedAt: string | null;
};

export async function getCurrentUser(accessToken: string | null | undefined): Promise<CurrentUser | null> {
  if (!accessToken) {
    return null;
  }

  const supabase = createServerSupabaseClient(accessToken);
  const enrichedQuery = await supabase
    .from("users")
    .select("id,agency_id,email,full_name,role,onboarding_completed_at,onboarding_skipped_at")
    .maybeSingle();

  if (enrichedQuery.error) {
    const fallbackQuery = await supabase
      .from("users")
      .select("id,agency_id,email,full_name,role")
      .maybeSingle();

    if (fallbackQuery.error || !fallbackQuery.data) {
      return null;
    }

    return {
      id: fallbackQuery.data.id,
      agencyId: fallbackQuery.data.agency_id,
      email: fallbackQuery.data.email,
      fullName: fallbackQuery.data.full_name,
      role: fallbackQuery.data.role as AppUserRole,
      onboardingCompletedAt: null,
      onboardingSkippedAt: null
    };
  }

  if (!enrichedQuery.data) {
    return null;
  }

  return {
    id: enrichedQuery.data.id,
    agencyId: enrichedQuery.data.agency_id,
    email: enrichedQuery.data.email,
    fullName: enrichedQuery.data.full_name,
    role: enrichedQuery.data.role as AppUserRole,
    onboardingCompletedAt: enrichedQuery.data.onboarding_completed_at ?? null,
    onboardingSkippedAt: enrichedQuery.data.onboarding_skipped_at ?? null
  };
}
