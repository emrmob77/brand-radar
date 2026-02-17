import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, EXPIRES_AT_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    const supabase = createServerSupabaseClient(accessToken);
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(EXPIRES_AT_COOKIE);
  return response;
}

