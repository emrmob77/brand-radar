"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const competitorSchema = z.object({
  clientId: z.string().uuid("Please select a valid client."),
  name: z.string().trim().min(2, "Competitor name must be at least 2 characters."),
  domain: z.string().trim().min(3, "Please enter a valid domain.")
});

export type NewCompetitorFormState = {
  error: string | null;
  fieldErrors?: {
    clientId?: string;
    name?: string;
    domain?: string;
  };
};

export const initialCompetitorFormState: NewCompetitorFormState = {
  error: null,
  fieldErrors: {}
};

function normalizeDomain(input: string): string | null {
  try {
    if (input.startsWith("http://") || input.startsWith("https://")) {
      return new URL(input).hostname.toLowerCase();
    }

    return new URL(`https://${input}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function createCompetitorAction(_prev: NewCompetitorFormState, formData: FormData): Promise<NewCompetitorFormState> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { error: "Session not found.", fieldErrors: {} };
  }

  const domainEntry = formData.get("domain");
  const normalizedDomain = normalizeDomain(typeof domainEntry === "string" ? domainEntry.trim() : "");
  const parsed = competitorSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    domain: normalizedDomain ?? ""
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error: parsed.error.issues[0]?.message ?? "Form validation failed.",
      fieldErrors: {
        clientId: fieldErrors.clientId?.[0],
        name: fieldErrors.name?.[0],
        domain: fieldErrors.domain?.[0]
      }
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { count, error: countError } = await supabase
    .from("competitors")
    .select("*", { count: "exact", head: true })
    .eq("client_id", parsed.data.clientId);

  if (countError) {
    return { error: countError.message, fieldErrors: {} };
  }

  if ((count ?? 0) >= 10) {
    return { error: "A maximum of 10 competitors can be added per client.", fieldErrors: {} };
  }

  const { error } = await supabase.from("competitors").insert({
    client_id: parsed.data.clientId,
    name: parsed.data.name,
    domain: parsed.data.domain
  });

  if (error) {
    return { error: error.message, fieldErrors: {} };
  }

  revalidatePath("/competitors");
  redirect(`/competitors?clientId=${encodeURIComponent(parsed.data.clientId)}`);
}
