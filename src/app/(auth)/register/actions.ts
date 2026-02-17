"use server";

import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  EXPIRES_AT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  toAuthCookieSession
} from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterFormValues } from "@/app/(auth)/register/schema";

export type SignUpResult = {
  ok: boolean;
  error?: string;
  requiresEmailVerification?: boolean;
};

function setSessionCookies(session: ReturnType<typeof toAuthCookieSession>) {
  const cookieStore = cookies();
  const secure = process.env.NODE_ENV === "production";
  const accessTokenMaxAge = Math.max(session.expiresAt - Math.floor(Date.now() / 1000), 1);

  cookieStore.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessTokenMaxAge
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS
  });
  cookieStore.set(EXPIRES_AT_COOKIE, String(session.expiresAt), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessTokenMaxAge
  });
}

export async function signUpWithPassword(values: RegisterFormValues): Promise<SignUpResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data."
    };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return {
      ok: false,
      error: error.message
    };
  }

  if (data.session) {
    setSessionCookies(toAuthCookieSession(data.session));
    return { ok: true };
  }

  return {
    ok: true,
    requiresEmailVerification: true
  };
}
