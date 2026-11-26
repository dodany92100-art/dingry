import "server-only";

import {
  DEFAULT_SHOP_STOREFRONT_COPY,
  normalizeShopStorefrontCopy,
  type ShopStorefrontCopyConfig,
} from "@/lib/shop-storefront-copy";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPrivateConfigTableMissing } from "@/lib/supabase/atelier-custom-store";

const SHOP_STOREFRONT_COPY_KEY = "shop_storefront_copy";

type PrivateConfigRow = {
  payload: string;
  is_active: boolean;
};

export async function readShopStorefrontCopy(): Promise<ShopStorefrontCopyConfig> {
  const { data, error } = await supabaseAdmin()
    .from("shop_private_config")
    .select("payload, is_active")
    .eq("key", SHOP_STOREFRONT_COPY_KEY)
    .maybeSingle();

  if (error) {
    if (isPrivateConfigTableMissing(error)) return normalizeShopStorefrontCopy(null);
    throw new Error(error.message);
  }

  const row = data as PrivateConfigRow | null;
  if (!row?.is_active || !row.payload.trim()) return normalizeShopStorefrontCopy(null);

  try {
    const parsed = JSON.parse(row.payload) as unknown;
    return normalizeShopStorefrontCopy(parsed);
  } catch {
    return normalizeShopStorefrontCopy(null);
  }
}

export async function writeShopStorefrontCopy(config: ShopStorefrontCopyConfig): Promise<ShopStorefrontCopyConfig> {
  const next = normalizeShopStorefrontCopy(config);
  const { error } = await supabaseAdmin().from("shop_private_config").upsert(
    {
      key: SHOP_STOREFRONT_COPY_KEY,
      payload: JSON.stringify(next),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  return next;
}

export { DEFAULT_SHOP_STOREFRONT_COPY };