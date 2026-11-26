import { DEFAULT_SHOP_VITRINE_AMBIENCE } from "@/lib/shop-vitrine-ambience";
import { jsonNoStore } from "@/lib/http";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { readShopVitrineAmbience } from "@/lib/supabase/shop-vitrine-ambience-store";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseStoreEnabled()) {
    return jsonNoStore({ ambience: DEFAULT_SHOP_VITRINE_AMBIENCE });
  }
  try {
    const ambience = await readShopVitrineAmbience();
    return jsonNoStore({ ambience });
  } catch {
    return jsonNoStore({ ambience: DEFAULT_SHOP_VITRINE_AMBIENCE });
  }
}