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
};

export const initialWhiteLabelFormState: WhiteLabelFormState = {
  error: null,
  success: null
};

export async function updateWhiteLabelAction(
  _prev: WhiteLabelFormState,
  formData: FormData
): Promise<WhiteLabelFormState> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { error: "Session not found.", success: null };
  }

  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Only admin users can update white-label settings.", success: null };
  }

  const parsed = whiteLabelSchema.safeParse({
    companyName: formData.get("companyName"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Validation failed.",
      success: null
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
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
      return { error: uploadResult.error.message, success: null };
    }

    const publicUrlResult = supabase.storage.from("client-logos").getPublicUrl(path);
    logoUrl = publicUrlResult.data.publicUrl;
  }

  const updatePayload: {
    name: string;
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
  } = {
    name: parsed.data.companyName,
    primary_color: parsed.data.primaryColor,
    secondary_color: parsed.data.secondaryColor
  };

  if (logoUrl) {
    updatePayload.logo_url = logoUrl;
  }

  const updateResult = await supabase
    .from("agencies")
    .update(updatePayload)
    .eq("id", currentUser.agencyId);
  if (updateResult.error) {
    return { error: updateResult.error.message, success: null };
  }

  revalidatePath("/settings");
  revalidatePath("/settings/white-label");
  return {
    error: null,
    success: "White-label settings saved."
  };
}
