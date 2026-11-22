import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import {
  getSupabaseShopBannerByPosition,
  SHOP_BANNER_POSITION_ATELIER_CUSTOM,
} from "@/lib/supabase/shop-banners";

const ATELIER_PRIVATE_CONFIG_KEY = "atelier_custom";
const MIGRATION_HINT =
  "Table shop_private_config absente : applique la migration Supabase 20261122181000_shop_private_config_atelier.sql";

type PrivateConfigRow = {
  payload: string;
  updated_at: string;
  is_active: boolean;
};

type SupabaseStoreError = { code?: string; message?: string };

/** Table privée absente (Postgres 42P01 ou PostgREST PGRST205). */
export function isPrivateConfigTableMissing(error: SupabaseStoreError): boolean {
  const code = error.code?.trim();
  return code === "PGRST205" || code === "42P01";
}

export async function readSupabaseAtelierCustomJson(): Promise<{ json: string | null; updatedAt: string }> {
  const { data, error } = await supabaseAdmin()
    .from("shop_private_config")
    .select("payload, updated_at, is_active")
    .eq("key", ATELIER_PRIVATE_CONFIG_KEY)
    .maybeSingle();

  if (error) {
    if (isPrivateConfigTableMissing(error)) {
      return readLegacyAtelierFromShopBanners();
    }
    throw new Error(error.message);
  }

  const row = data as PrivateConfigRow | null;
  if (!row || !row.is_active) {
    return { json: null, updatedAt: row?.updated_at ?? "" };
  }
  const json = row.payload?.trim() ? row.payload : null;
  return { json, updatedAt: row.updated_at ?? "" };
}

/** Pré-migration : lecture seule depuis shop_banners. */
async function readLegacyAtelierFromShopBanners(): Promise<{ json: string | null; updatedAt: string }> {
  const row = await getSupabaseShopBannerByPosition(SHOP_BANNER_POSITION_ATELIER_CUSTOM);
  return {
    json: row?.link_url?.trim() ? row.link_url : null,
    updatedAt: row?.updated_at ?? "",
  };
}

export async function upsertSupabaseAtelierCustomJson(json: string, enabled: boolean): Promise<string> {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin().from("shop_private_config").upsert(
    {
      key: ATELIER_PRIVATE_CONFIG_KEY,
      payload: json,
      is_active: enabled,
      updated_at: now,
    },
    { onConflict: "key" },
  );

  if (error) {
    if (isPrivateConfigTableMissing(error)) {
      throw new Error(MIGRATION_HINT);
    }
    throw new Error(error.message);
  }
  return now;
}