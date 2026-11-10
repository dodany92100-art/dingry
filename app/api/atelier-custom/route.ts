import {
  resolveShopAtelierCustomConfig,
  SHOP_ATELIER_CUSTOM_DEFAULT,
  type AdminAtelierCustomConfig,
} from "@/lib/atelier-custom-config";
import { parseAtelierCustomJson } from "@/lib/admin/parse-atelier-custom";
import { jsonNoStore } from "@/lib/http";
import { readSupabaseAtelierCustomJson } from "@/lib/supabase/shop-banners";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { json, updatedAt } = await readSupabaseAtelierCustomJson();
    const parsed = json ? parseAtelierCustomJson(json) : null;
    const config: AdminAtelierCustomConfig = parsed
      ? { ...parsed, updatedAt: parsed.updatedAt || updatedAt }
      : SHOP_ATELIER_CUSTOM_DEFAULT;
    return jsonNoStore(resolveShopAtelierCustomConfig(config));
  } catch {
    return jsonNoStore(resolveShopAtelierCustomConfig(SHOP_ATELIER_CUSTOM_DEFAULT));
  }
}
