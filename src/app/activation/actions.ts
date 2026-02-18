"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logServerError } from "@/lib/monitoring/error-logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OnboardingClientSummary = {
  id: string;
  name: string;
  domain: string;
  industry: string;
};

export type OnboardingPlatformOption = {
  id: string;
  name: string;
  slug: string;
};

export type OnboardingInitialData = {
  userFullName: string;
  agencyName: string;
  clients: OnboardingClientSummary[];
  platforms: OnboardingPlatformOption[];
  onboardingDone: boolean;
};

type OnboardingActionResult =
  | {
      ok: true;
      redirectTo: string;
    }
  | {
      ok: false;
      error: string;
    };

const onboardingSubmitSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  agencyName: z.string().trim().min(2, "Agency name must be at least 2 characters."),
  useExistingClient: z.boolean(),
  existingClientId: z.string().uuid().nullable(),
  clientName: z.string().trim().optional(),
  clientDomain: z.string().trim().optional(),
  clientIndustry: z.string().trim().optional(),
  selectedPlatformSlugs: z.array(z.string().trim().min(1)).min(1, "Select at least one platform."),
  firstQueryText: z.string().trim().min(4, "Enter your first query."),
  firstQueryCategory: z.string().trim().min(2, "Category is required.")
});

function normalizeDomain(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) {
    return null;
  }

  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return new URL(raw).hostname;
    }
    return new URL(`https://${raw}`).hostname;
  } catch {
    return null;
  }
}

export async function getOnboardingInitialData(): Promise<OnboardingInitialData | null> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  const currentUser = await getCurrentUser(accessToken);
  if (!accessToken || !currentUser) {
    return null;
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [agencyResult, clientsResult, platformsResult] = await Promise.all([
    supabase.from("agencies").select("name").eq("id", currentUser.agencyId).maybeSingle(),
    supabase.from("clients").select("id,name,domain,industry").order("name", { ascending: true }).limit(20),
    supabase.from("platforms").select("id,name,slug").eq("active", true).order("name", { ascending: true })
  ]);

  const clients: OnboardingClientSummary[] = (clientsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    domain: row.domain,
    industry: row.industry
  }));

  const platforms: OnboardingPlatformOption[] = (platformsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug
  }));

  return {
    userFullName: currentUser.fullName,
    agencyName: agencyResult.data?.name ?? "My Agency",
    clients,
    platforms,
    onboardingDone: Boolean(currentUser.onboardingCompletedAt || currentUser.onboardingSkippedAt)
  };
}

export async function skipOnboardingAction(): Promise<OnboardingActionResult> {
  try {
    const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
    const currentUser = await getCurrentUser(accessToken);
    if (!accessToken || !currentUser) {
      return { ok: false, error: "Session not found." };
    }

    const supabase = createServerSupabaseClient(accessToken);
    const updateResult = await supabase
      .from("users")
      .update({
        onboarding_skipped_at: new Date().toISOString()
      })
      .eq("id", currentUser.id);

    if (updateResult.error) {
      return { ok: false, error: updateResult.error.message };
    }

    revalidatePath("/", "layout");
    return {
      ok: true,
      redirectTo: "/"
    };
  } catch (error) {
    await logServerError(error, { area: "activation/skip-onboarding" });
    return { ok: false, error: "Could not skip onboarding." };
  }
}

export async function completeOnboardingAction(input: z.infer<typeof onboardingSubmitSchema>): Promise<OnboardingActionResult> {
  try {
    const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
    const currentUser = await getCurrentUser(accessToken);
    if (!accessToken || !currentUser) {
      return { ok: false, error: "Session not found." };
    }

    const parsed = onboardingSubmitSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid onboarding payload."
      };
    }

    const supabase = createServerSupabaseClient(accessToken);
    const canWriteData = currentUser.role === "admin" || currentUser.role === "editor";
    const normalizedDomain = normalizeDomain(parsed.data.clientDomain ?? "");

    if (!parsed.data.useExistingClient) {
      if (!parsed.data.clientName || parsed.data.clientName.trim().length < 2) {
        return { ok: false, error: "Client name is required." };
      }
      if (!normalizedDomain) {
        return { ok: false, error: "Client domain must be valid." };
      }
      if (!parsed.data.clientIndustry || parsed.data.clientIndustry.trim().length < 2) {
        return { ok: false, error: "Client industry is required." };
      }
    }

    const userUpdate = await supabase
      .from("users")
      .update({
        full_name: parsed.data.fullName
      })
      .eq("id", currentUser.id);
    if (userUpdate.error) {
      return { ok: false, error: userUpdate.error.message };
    }

    if (currentUser.role === "admin") {
      const agencyUpdate = await supabase
        .from("agencies")
        .update({
          name: parsed.data.agencyName
        })
        .eq("id", currentUser.agencyId);
      if (agencyUpdate.error) {
        return { ok: false, error: agencyUpdate.error.message };
      }
    }

    let clientId: string | null = parsed.data.existingClientId ?? null;

    if (canWriteData) {
      if (parsed.data.useExistingClient && parsed.data.existingClientId) {
        const existingClient = await supabase
          .from("clients")
          .select("id")
          .eq("id", parsed.data.existingClientId)
          .eq("agency_id", currentUser.agencyId)
          .maybeSingle();
        if (existingClient.error) {
          return { ok: false, error: existingClient.error.message };
        }
        if (!existingClient.data?.id) {
          return { ok: false, error: "Selected client could not be found." };
        }
        clientId = existingClient.data.id;
      }

      if (!parsed.data.useExistingClient) {
        const insertResult = await supabase
          .from("clients")
          .insert({
            agency_id: currentUser.agencyId,
            name: parsed.data.clientName?.trim() ?? "",
            domain: normalizedDomain ?? "",
            industry: parsed.data.clientIndustry?.trim() ?? "",
            active_platforms: parsed.data.selectedPlatformSlugs
          })
          .select("id")
          .maybeSingle();

        if (insertResult.error) {
          return { ok: false, error: insertResult.error.message };
        }
        clientId = insertResult.data?.id ?? null;
      }

      if (clientId) {
        await supabase
          .from("clients")
          .update({ active_platforms: parsed.data.selectedPlatformSlugs })
          .eq("id", clientId);

        await supabase.from("queries").insert({
          client_id: clientId,
          text: parsed.data.firstQueryText,
          category: parsed.data.firstQueryCategory,
          priority: "medium"
        });
      }
    }

    const onboardingUpdate = await supabase
      .from("users")
      .update({
        onboarding_completed_at: new Date().toISOString(),
        onboarding_skipped_at: null
      })
      .eq("id", currentUser.id);
    if (onboardingUpdate.error) {
      return { ok: false, error: onboardingUpdate.error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/clients");
    revalidatePath("/visibility");
    revalidatePath("/mentions");

    return {
      ok: true,
      redirectTo: clientId ? `/?clientId=${encodeURIComponent(clientId)}` : "/"
    };
  } catch (error) {
    await logServerError(error, { area: "activation/complete-onboarding" });
    return { ok: false, error: "Could not complete onboarding." };
  }
}
