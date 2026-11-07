import { revalidatePath, revalidateTag } from "next/cache";
import { SHOP_CATALOG_CACHE_TAG } from "@/lib/server/shop-catalog-cache";

/** Invalide le cache catalogue boutique après une écriture CRM (produits, lookbook si besoin). */
export function revalidateShopCatalog(): void {
  revalidateTag(SHOP_CATALOG_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/api/catalog");
}
