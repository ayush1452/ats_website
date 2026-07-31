"use client";

import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}

export function startDemoSession() {
  localStorage.setItem(
    "resumepilot:demo-session",
    JSON.stringify({ startedAt: new Date().toISOString(), user: "Alex Morgan" }),
  );
  document.cookie = "resumepilot_demo=1; Path=/; SameSite=Lax; Max-Age=604800";
}
