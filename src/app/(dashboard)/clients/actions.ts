"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type DeleteClientResult = {
  ok: boolean;
  error?: string;
};

export async function deleteClientAction(clientId: string): Promise<DeleteClientResult> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return {
      ok: false,
      error: "Session not found."
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { error } = await supabase.from("clients").delete().eq("id", clientId);

  if (error) {
    return {
      ok: false,
      error: error.message
    };
  }

  revalidatePath("/clients");
  return { ok: true };
}
