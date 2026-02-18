import { type NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  EXPIRES_AT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  isExpiringSoon,
  parseExpiresAt,
  toAuthCookieSession
} from "@/lib/auth/session";
import { getSupabaseEnv } from "@/lib/supabase/env";

type RefreshedSession = ReturnType<typeof toAuthCookieSession>;
type UserRole = "admin" | "editor" | "viewer" | null;

function decodeJwtPayload(token: string): { exp?: number; sub?: string } | null {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return null;
  }

  const payload = segments[1];
  if (!payload) {
    return null;
  }

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

  try {
    return JSON.parse(atob(padded)) as { exp?: number; sub?: string };
  } catch {
    return null;
  }
}

function decodeJwtExpiry(token: string): number | null {
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === "number" ? payload.exp : null;
}

function setSessionCookies(response: NextResponse, session: RefreshedSession) {
  const secure = process.env.NODE_ENV === "production";
  const maxAge = Math.max(session.expiresAt - Math.floor(Date.now() / 1000), 1);

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  response.cookies.set(EXPIRES_AT_COOKIE, String(session.expiresAt), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge
  });
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(EXPIRES_AT_COOKIE);
}

function copyCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}

async function refreshSession(refreshToken: string): Promise<RefreshedSession | null> {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        apikey: supabasePublishableKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      expires_at?: number;
    };

    if (!payload.access_token || !payload.refresh_token) {
      return null;
    }

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt: payload.expires_at ?? Math.floor(Date.now() / 1000) + (payload.expires_in ?? 3600)
    };
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  );
}

function isPublicAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

function isAdminOnlyPath(pathname: string) {
  return pathname === "/settings/users" || pathname.startsWith("/settings/users/") || pathname === "/settings/white-label" || pathname.startsWith("/settings/white-label/");
}

function isWriteMethod(method: string) {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function canViewerWrite(pathname: string) {
  return pathname === "/auth/sign-out";
}

function forbiddenRedirect(request: NextRequest, reason: "admin_required" | "viewer_read_only") {
  const forbiddenUrl = request.nextUrl.clone();
  forbiddenUrl.pathname = "/forbidden";
  forbiddenUrl.search = "";
  forbiddenUrl.searchParams.set("reason", reason);
  forbiddenUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(forbiddenUrl);
}

async function fetchUserRole(accessToken: string): Promise<UserRole> {
  const payload = decodeJwtPayload(accessToken);
  const userId = payload?.sub;
  if (!userId) {
    return null;
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?select=role&id=eq.${encodeURIComponent(userId)}&limit=1`,
      {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<{ role?: string }>;
    const role = data[0]?.role;
    return role === "admin" || role === "editor" || role === "viewer" ? role : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isAuthPageRoute = isPublicAuthRoute(pathname);
  const response = NextResponse.next();

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const expiresAtFromCookie = parseExpiresAt(request.cookies.get(EXPIRES_AT_COOKIE)?.value);
  const expiresAt = expiresAtFromCookie ?? (accessToken ? decodeJwtExpiry(accessToken) : null);

  let authenticated = Boolean(accessToken);
  const shouldRefresh = Boolean(refreshToken) && (!accessToken || !expiresAt || isExpiringSoon(expiresAt));

  if (shouldRefresh && refreshToken) {
    const refreshedSession = await refreshSession(refreshToken);

    if (refreshedSession) {
      setSessionCookies(response, refreshedSession);
      accessToken = refreshedSession.accessToken;
      authenticated = true;
    } else {
      clearSessionCookies(response);
      accessToken = undefined;
      authenticated = false;
    }
  }

  if (!authenticated && !isAuthPageRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (authenticated && isAuthPageRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (authenticated && accessToken && !isAuthPageRoute) {
    const role = await fetchUserRole(accessToken);

    if (isAdminOnlyPath(pathname) && role !== "admin") {
      const redirectResponse = forbiddenRedirect(request, "admin_required");
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }

    if (role === "viewer" && isWriteMethod(request.method) && !canViewerWrite(pathname)) {
      const redirectResponse = forbiddenRedirect(request, "viewer_read_only");
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};
