/** Paire Supabase CRM (lecture catalogue / images) — testable sans le garde-fou `VITEST` de `isSupabaseStoreEnabled`. */
export function isSupabaseCatalogEnvComplete(): boolean {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return url.length > 0 && key.length > 0;
}

export { isR2ImageStorageEnabled } from "@/lib/r2/config";

/** Déploiement Vercel Preview (`VERCEL_ENV=preview`, hors prod custom). */
export function isVercelPreviewRuntime(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

/** Seed / fichier local si lecture snapshot impossible. */
export function allowCatalogSeedFallback(): boolean {
  return process.env.NODE_ENV !== "production" || isVercelPreviewRuntime();
}

/** Prod : Supabase CRM (catalogue) ou seed preview / dev. */
export function hasProductionCatalogBackend(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return allowCatalogSeedFallback() || isSupabaseCatalogEnvComplete();
}
