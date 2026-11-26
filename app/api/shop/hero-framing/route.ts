import { DEFAULT_SHOP_HERO_FRAMING_DEFAULTS } from "@/lib/shop-hero-slides";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { readShopHeroFramingMap } from "@/lib/supabase/shop-hero-framing-store";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseStoreEnabled()) {
    return jsonNoStore({ framing: DEFAULT_SHOP_HERO_FRAMING_DEFAULTS });
  }
  try {
    const framing = await readShopHeroFramingMap();
    return jsonNoStore({ framing });
  } catch {
    return jsonNoStore({ framing: DEFAULT_SHOP_HERO_FRAMING_DEFAULTS });
  }
}