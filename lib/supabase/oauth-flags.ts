function supabaseAuthEnvReady(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return url.length > 0 && key.length > 0;
}

/** Mettre à `1` en prod quand Google est activé dans Supabase Auth. */
export function isSupabaseOAuthProviderEnabled(provider: "google"): boolean {
  if (provider !== "google") return false;
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_OAUTH_GOOGLE ?? "").trim();
  if (raw === "0") return false;
  if (raw === "1") return true;
  if (!supabaseAuthEnvReady()) return false;
  return true;
}
