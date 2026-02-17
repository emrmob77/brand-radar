import type { Session } from "@supabase/supabase-js";

export const ACCESS_TOKEN_COOKIE = "br-access-token";
export const REFRESH_TOKEN_COOKIE = "br-refresh-token";
export const EXPIRES_AT_COOKIE = "br-expires-at";
export const SESSION_REFRESH_THRESHOLD_SECONDS = 60;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AuthCookieSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export function toAuthCookieSession(session: Session): AuthCookieSession {
  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600);

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt
  };
}

export function parseExpiresAt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function isExpiringSoon(expiresAt: number, nowInSeconds = Math.floor(Date.now() / 1000)): boolean {
  return expiresAt - nowInSeconds <= SESSION_REFRESH_THRESHOLD_SECONDS;
}

