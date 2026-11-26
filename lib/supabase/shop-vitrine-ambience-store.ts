import "server-only";

import {
  normalizeShopVitrineAmbience,
  type ShopVitrineAmbienceConfig,
  DEFAULT_SHOP_VITRINE_AMBIENCE,
} from "@/lib/shop-vitrine-ambience";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPrivateConfigTableMissing } from "@/lib/supabase/atelier-custom-store";

const SHOP_VITRINE_AMBIENCE_KEY = "shop_vitrine_ambience";

type PrivateConfigRow = {
  payload: string;
  is_active: boolean;
};

export async function readShopVitrineAmbience(): Promise<ShopVitrineAmbienceConfig> {
  const { data, error } = await supabaseAdmin()
    .from("shop_private_config")
    .select("payload, is_active")
    .eq("key", SHOP_VITRINE_AMBIENCE_KEY)
    .maybeSingle();

  if (error) {
    if (isPrivateConfigTableMissing(error)) return { ...DEFAULT_SHOP_VITRINE_AMBIENCE };
    throw new Error(error.message);
  }

  const row = data as PrivateConfigRow | null;
  if (!row?.is_active || !row.payload.trim()) return { ...DEFAULT_SHOP_VITRINE_AMBIENCE };

  try {
    const parsed = JSON.parse(row.payload) as unknown;
    return normalizeShopVitrineAmbience(parsed);
  } catch {
    return { ...DEFAULT_SHOP_VITRINE_AMBIENCE };
  }
}

export async function writeShopVitrineAmbience(
  config: ShopVitrineAmbienceConfig,
): Promise<ShopVitrineAmbienceConfig> {
  const next = normalizeShopVitrineAmbience(config);
  const { error } = await supabaseAdmin().from("shop_private_config").upsert(
    {
      key: SHOP_VITRINE_AMBIENCE_KEY,
      payload: JSON.stringify(next),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  return next;
}