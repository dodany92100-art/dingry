import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseUrl(): string {
  return (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
}

export function isSupabaseStoreEnabled(): boolean {
  if (process.env.VITEST) return false;
  const url = supabaseUrl();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return url.length > 0 && key.length > 0;
}

let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  const url = supabaseUrl();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    throw new Error("Supabase non configuré (URL + SUPABASE_SERVICE_ROLE_KEY).");
  }
  cached ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
