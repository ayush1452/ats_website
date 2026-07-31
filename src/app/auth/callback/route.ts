import { NextResponse } from "next/server";

import { getServerSupabase } from "@/lib/auth/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/app";
  const supabase = await getServerSupabase();

  if (!supabase || !code) {
    return NextResponse.redirect(new URL("/login?error=invalid-callback", url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=verification-failed", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
