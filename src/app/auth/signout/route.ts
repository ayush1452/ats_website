import { NextResponse } from "next/server";

import { getServerSupabase } from "@/lib/auth/server";

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (supabase) await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete("resumepilot_demo");
  return response;
}
