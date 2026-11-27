import { jsonNoStore } from "@/lib/http";
import { DEFAULT_EDITORIAL_BANNER_FOCUS } from "@/lib/editorial-banner-focus";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { readEditorialBannerFocusMap } from "@/lib/supabase/editorial-banner-focus-store";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseStoreEnabled()) return jsonNoStore(DEFAULT_EDITORIAL_BANNER_FOCUS);
  try {
    return jsonNoStore(await readEditorialBannerFocusMap());
  } catch {
    return jsonNoStore(DEFAULT_EDITORIAL_BANNER_FOCUS);
  }
}