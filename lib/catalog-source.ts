import { isSupabaseStoreEnabled } from "@/lib/supabase/server";

/** Origine des fiches produit pour la vitrine (CRM = Supabase quand configuré). */
export type CatalogProductSource = "supabase" | "store-file";

export function catalogProductSource(): CatalogProductSource {
  return isSupabaseStoreEnabled() ? "supabase" : "store-file";
}
