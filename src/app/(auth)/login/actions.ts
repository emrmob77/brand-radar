"use server";

import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  EXPIRES_AT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  toAuthCookieSession
} from "@/lib/auth/session";
import { loginSchema, type LoginFormValues } from "@/app/(auth)/login/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export type SignInResult = {
  ok: boolean;
  error?: string;
};

export async function signInWithPassword(values: LoginFormValues): Promise<SignInResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data."
    };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.session) {
    return {
      ok: false,
      error: error?.message ?? "Sign in failed."
    };
  }

  setSessionCookies(toAuthCookieSession(data.session));
  return { ok: true };
}
