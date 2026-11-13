function supabaseAuthEnvReady(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return url.length > 0 && key.length > 0;
}

/** Mettre à `1` en prod quand le provider est activé dans Supabase Auth. */
export function isSupabaseOAuthProviderEnabled(provider: "google" | "apple"): boolean {
  const key =
    provider === "google" ? "NEXT_PUBLIC_SUPABASE_OAUTH_GOOGLE" : "NEXT_PUBLIC_SUPABASE_OAUTH_APPLE";
  const raw = (process.env[key] ?? "").trim();
  if (raw === "0") return false;
  if (raw === "1") return true;
  if (!supabaseAuthEnvReady()) return false;
  if (provider === "apple") {
    return (process.env.NEXT_PUBLIC_SUPABASE_OAUTH_APPLE ?? "").trim() === "1";
  }
  return true;
}
