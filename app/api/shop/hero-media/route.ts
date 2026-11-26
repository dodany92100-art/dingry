import { jsonNoStore } from "@/lib/http";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { readShopHeroMediaMap } from "@/lib/supabase/shop-hero-media-store";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseStoreEnabled()) {
    return jsonNoStore({ media: {} });
  }
  try {
    const media = await readShopHeroMediaMap();
    return jsonNoStore({ media });
  } catch {
    return jsonNoStore({ media: {} });
  }
}