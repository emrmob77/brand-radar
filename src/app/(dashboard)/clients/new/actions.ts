"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { newClientSchema } from "@/app/(dashboard)/clients/new/schema";

export type NewClientFormState = {
  error: string | null;
  fieldErrors?: {
    name?: string;
    domain?: string;
    industry?: string;
    platformSlugs?: string;
  };
};

export const initialNewClientFormState: NewClientFormState = {
  error: null,
  fieldErrors: {}
};

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

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function createClientAction(_prevState: NewClientFormState, formData: FormData): Promise<NewClientFormState> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return {
      error: "Session not found. Please sign in again.",
      fieldErrors: {}
    };
  }

  const platformSlugs = formData.getAll("platformSlugs").filter((value): value is string => typeof value === "string");
  const domainEntry = formData.get("domain");
  const rawDomain = typeof domainEntry === "string" ? domainEntry : "";
  const normalizedDomain = normalizeDomain(rawDomain);

  const parsed = newClientSchema.safeParse({
    name: formData.get("name"),
    domain: normalizedDomain ?? "",
    industry: formData.get("industry"),
    platformSlugs
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error: parsed.error.issues[0]?.message ?? "Form validation failed.",
      fieldErrors: {
        name: fieldErrors.name?.[0],
        domain: fieldErrors.domain?.[0],
        industry: fieldErrors.industry?.[0],
        platformSlugs: fieldErrors.platformSlugs?.[0]
      }
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "User session could not be validated.",
      fieldErrors: {}
    };
  }

  const { data: userProfile, error: userProfileError } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (userProfileError || !userProfile?.agency_id) {
    return {
      error: "Agency information not found.",
      fieldErrors: {}
    };
  }

  let logoUrl: string | null = null;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    if (!logoFile.type.startsWith("image/")) {
      return {
        error: "Logo file must be a valid image.",
        fieldErrors: {}
      };
    }

    const safeName = sanitizeFileName(logoFile.name || "logo.png");
    const storagePath = `${userProfile.agency_id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("client-logos").upload(storagePath, logoFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: logoFile.type
    });

    if (uploadError) {
      return {
        error: "Logo upload failed. Check storage settings.",
        fieldErrors: {}
      };
    }

    const { data: publicData } = supabase.storage.from("client-logos").getPublicUrl(storagePath);
    logoUrl = publicData.publicUrl;
  }

  const { error: insertError } = await supabase.from("clients").insert({
    agency_id: userProfile.agency_id,
    name: parsed.data.name,
    domain: parsed.data.domain,
    logo_url: logoUrl,
    industry: parsed.data.industry,
    active_platforms: parsed.data.platformSlugs
  });

  if (insertError) {
    return {
      error: insertError.message,
      fieldErrors: {}
    };
  }

  revalidatePath("/clients");
  redirect("/clients");
}
