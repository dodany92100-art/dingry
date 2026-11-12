/** Mettre à `1` uniquement quand le provider est activé dans Supabase Auth (Google / Apple). */
export function isSupabaseOAuthProviderEnabled(provider: "google" | "apple"): boolean {
  const key =
    provider === "google" ? "NEXT_PUBLIC_SUPABASE_OAUTH_GOOGLE" : "NEXT_PUBLIC_SUPABASE_OAUTH_APPLE";
  return (process.env[key] ?? "").trim() === "1";
}
