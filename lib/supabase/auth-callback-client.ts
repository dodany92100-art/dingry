"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseBrowserAuthEnabled } from "@/lib/supabase/browser";

/** Client dédié au retour OAuth : PKCE si `?code=`, implicit si hash (tokens). */
export function getSupabaseOAuthCallbackClient(): SupabaseClient | null {
  if (!isSupabaseBrowserAuthEnabled()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  const hasCode =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("code");
  const flowType = hasCode ? "pkce" : "implicit";
  return createClient(url, key, {
    auth: {
      flowType,
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
