import { normalizeShopStorefrontCopy } from "@/lib/shop-storefront-copy";
import { jsonNoStore } from "@/lib/http";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { readShopStorefrontCopy } from "@/lib/supabase/shop-storefront-copy-store";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseStoreEnabled()) {
    return jsonNoStore({ copy: normalizeShopStorefrontCopy(null) });
  }
  try {
    const copy = await readShopStorefrontCopy();
    return jsonNoStore({ copy });
  } catch {
    return jsonNoStore({ copy: normalizeShopStorefrontCopy(null) });
  }
}