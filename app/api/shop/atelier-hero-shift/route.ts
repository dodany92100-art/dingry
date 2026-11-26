import { jsonNoStore } from "@/lib/http";
import { DEFAULT_ATELIER_HERO_HARBOR_SHIFT } from "@/lib/atelier-hero-harbor-shift";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { readAtelierHeroHarborShift } from "@/lib/supabase/atelier-hero-harbor-shift-store";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseStoreEnabled()) return jsonNoStore(DEFAULT_ATELIER_HERO_HARBOR_SHIFT);
  try {
    return jsonNoStore(await readAtelierHeroHarborShift());
  } catch {
    return jsonNoStore(DEFAULT_ATELIER_HERO_HARBOR_SHIFT);
  }
}