import "server-only";

import {
  normalizeShopHeroFramingMap,
  type ShopHeroFramingMap,
} from "@/lib/shop-hero-framing";
import { DEFAULT_SHOP_HERO_FRAMING_DEFAULTS } from "@/lib/shop-hero-slides";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPrivateConfigTableMissing } from "@/lib/supabase/atelier-custom-store";

const SHOP_HERO_FRAMING_KEY = "shop_hero_framing";

type PrivateConfigRow = {
  payload: string;
  is_active: boolean;
};

export async function readShopHeroFramingMap(): Promise<ShopHeroFramingMap> {
  const { data, error } = await supabaseAdmin()
    .from("shop_private_config")
    .select("payload, is_active")
    .eq("key", SHOP_HERO_FRAMING_KEY)
    .maybeSingle();

  if (error) {
    if (isPrivateConfigTableMissing(error)) return { ...DEFAULT_SHOP_HERO_FRAMING_DEFAULTS };
    throw new Error(error.message);
  }

  const row = data as PrivateConfigRow | null;
  if (!row?.is_active || !row.payload.trim()) return { ...DEFAULT_SHOP_HERO_FRAMING_DEFAULTS };

  try {
    const parsed = JSON.parse(row.payload) as unknown;
    return normalizeShopHeroFramingMap(parsed, DEFAULT_SHOP_HERO_FRAMING_DEFAULTS);
  } catch {
    return { ...DEFAULT_SHOP_HERO_FRAMING_DEFAULTS };
  }
}

export async function writeShopHeroFramingMap(map: ShopHeroFramingMap): Promise<ShopHeroFramingMap> {
  const next = normalizeShopHeroFramingMap(map, DEFAULT_SHOP_HERO_FRAMING_DEFAULTS);
  const { error } = await supabaseAdmin().from("shop_private_config").upsert(
    {
      key: SHOP_HERO_FRAMING_KEY,
      payload: JSON.stringify(next),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  return next;
}