import "server-only";

import { normalizeShopHeroMediaMap, type ShopHeroMediaMap } from "@/lib/shop-hero-media";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPrivateConfigTableMissing } from "@/lib/supabase/atelier-custom-store";

const SHOP_HERO_MEDIA_KEY = "shop_hero_media";

type PrivateConfigRow = {
  payload: string;
  is_active: boolean;
};

export async function readShopHeroMediaMap(): Promise<ShopHeroMediaMap> {
  const { data, error } = await supabaseAdmin()
    .from("shop_private_config")
    .select("payload, is_active")
    .eq("key", SHOP_HERO_MEDIA_KEY)
    .maybeSingle();

  if (error) {
    if (isPrivateConfigTableMissing(error)) return {};
    throw new Error(error.message);
  }

  const row = data as PrivateConfigRow | null;
  if (!row?.is_active || !row.payload.trim()) return {};

  try {
    const parsed = JSON.parse(row.payload) as unknown;
    return normalizeShopHeroMediaMap(parsed);
  } catch {
    return {};
  }
}

export async function writeShopHeroMediaMap(map: ShopHeroMediaMap): Promise<ShopHeroMediaMap> {
  const next = normalizeShopHeroMediaMap(map);
  const { error } = await supabaseAdmin().from("shop_private_config").upsert(
    {
      key: SHOP_HERO_MEDIA_KEY,
      payload: JSON.stringify(next),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  return next;
}