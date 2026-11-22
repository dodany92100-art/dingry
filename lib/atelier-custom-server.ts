import { parseAtelierCustomJson } from "@/lib/admin/parse-atelier-custom";
import {
  personalizationProductIds,
  resolveShopAtelierCustomConfig,
  SHOP_ATELIER_CUSTOM_DEFAULT,
  type ShopAtelierCustomConfig,
} from "@/lib/atelier-custom-config";
import { readSupabaseAtelierCustomJson } from "@/lib/supabase/atelier-custom-store";

export async function loadShopAtelierCustomConfig(): Promise<ShopAtelierCustomConfig> {
  try {
    const { json } = await readSupabaseAtelierCustomJson();
    const parsed = json ? parseAtelierCustomJson(json) : null;
    return resolveShopAtelierCustomConfig(parsed ?? SHOP_ATELIER_CUSTOM_DEFAULT);
  } catch {
    return resolveShopAtelierCustomConfig(SHOP_ATELIER_CUSTOM_DEFAULT);
  }
}

export async function loadPersonalizationProductIds(): Promise<readonly number[]> {
  const config = await loadShopAtelierCustomConfig();
  return personalizationProductIds(config);
}
