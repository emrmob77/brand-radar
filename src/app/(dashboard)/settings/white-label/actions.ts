"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const hexColor = /^#[0-9a-fA-F]{6}$/;

const whiteLabelSchema = z.object({
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters."),
  primaryColor: z.string().regex(hexColor, "Primary color must be a valid hex value."),
  secondaryColor: z.string().regex(hexColor, "Secondary color must be a valid hex value.")
});

export type WhiteLabelFormState = {
  error: string | null;
  success: string | null;
  fieldErrors?: {
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
  };
};

export const initialWhiteLabelFormState: WhiteLabelFormState = {
  error: null,
  success: null,
  fieldErrors: {}
};

function isValidHostname(value: string) {
  if (value.length > 253) {
    return false;
  }

  const labels = value.split(".");
  if (labels.length < 2) {
    return false;
  }

  return labels.every((label) => {
    if (!label || label.length > 63) {
      return false;
    }

    if (label.startsWith("-") || label.endsWith("-")) {
      return false;
    }

    return /^[a-z0-9-]+$/.test(label);
  });
}

function normalizeCustomDomain(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) {
    return null;
  }

  const candidate = raw.replace(/\.$/, "");
  const urlValue = candidate.startsWith("http://") || candidate.startsWith("https://") ? candidate : `https://${candidate}`;

  try {
    const parsed = new URL(urlValue);
    const hostname = parsed.hostname.toLowerCase();
    return isValidHostname(hostname) ? hostname : null;
  } catch {
    return null;
  }
}

export async function updateWhiteLabelAction(
  _prev: WhiteLabelFormState,
  formData: FormData
): Promise<WhiteLabelFormState> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { error: "Session not found.", success: null, fieldErrors: {} };
  }

  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Only admin users can update white-label settings.", success: null, fieldErrors: {} };
  }

  const parsed = whiteLabelSchema.safeParse({
    companyName: formData.get("companyName"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor")
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error: parsed.error.issues[0]?.message ?? "Validation failed.",
      success: null,
      fieldErrors: {
        companyName: fieldErrors.companyName?.[0],
        primaryColor: fieldErrors.primaryColor?.[0],
        secondaryColor: fieldErrors.secondaryColor?.[0]
      }
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const customDomainEntry = formData.get("customDomain");
  const rawCustomDomain = typeof customDomainEntry === "string" ? customDomainEntry : "";
  const normalizedCustomDomain = normalizeCustomDomain(rawCustomDomain);

  if (rawCustomDomain.trim().length > 0 && !normalizedCustomDomain) {
    return {
      error: "Custom domain must be a valid hostname (example: geo.youragency.com).",
      success: null,
      fieldErrors: {
        customDomain: "Custom domain must be a valid hostname."
      }
    };
  }

  if (normalizedCustomDomain) {
    const existingDomain = await supabase
      .from("agencies")
      .select("id")
      .eq("custom_domain", normalizedCustomDomain)
      .neq("id", currentUser.agencyId)
      .limit(1)
      .maybeSingle();

    if (existingDomain.error) {
      return { error: existingDomain.error.message, success: null, fieldErrors: {} };
    }

    if (existingDomain.data?.id) {
      return {
        error: "This custom domain is already in use by another workspace.",
        success: null,
        fieldErrors: {
          customDomain: "This custom domain is already in use."
        }
      };
    }
  }

  let logoUrl: string | undefined;
  const logo = formData.get("logo");

  if (logo instanceof File && logo.size > 0) {
    const extension = logo.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `agency-logos/${currentUser.agencyId}/${Date.now()}.${extension}`;
    const uploadResult = await supabase.storage.from("client-logos").upload(path, logo, {
      upsert: true,
      cacheControl: "3600"
    });

    if (uploadResult.error) {
      return { error: uploadResult.error.message, success: null, fieldErrors: {} };
    }

    const publicUrlResult = supabase.storage.from("client-logos").getPublicUrl(path);
    logoUrl = publicUrlResult.data.publicUrl;
  }

  const updatePayload: {
    name: string;
    primary_color: string;
    secondary_color: string;
    custom_domain: string | null;
    logo_url?: string;
  } = {
    name: parsed.data.companyName,
    primary_color: parsed.data.primaryColor,
    secondary_color: parsed.data.secondaryColor,
    custom_domain: normalizedCustomDomain
  };

  if (logoUrl) {
    updatePayload.logo_url = logoUrl;
  }

  const updateResult = await supabase
    .from("agencies")
    .update(updatePayload)
    .eq("id", currentUser.agencyId);
  if (updateResult.error) {
    return { error: updateResult.error.message, success: null, fieldErrors: {} };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/settings/white-label");
  return {
    error: null,
    success: "White-label settings saved.",
    fieldErrors: {}
  };
}
