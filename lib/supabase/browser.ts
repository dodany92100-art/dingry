"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function isSupabaseBrowserAuthEnabled(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return url.length > 0 && key.length > 0;
}

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseBrowserAuthEnabled()) return null;
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  cached = createClient(url, key, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      experimental: { appendPkceFlowIdToRedirects: true },
    },
  });
  return cached;
}
