import { resolveRectoCatalogId } from "@/lib/catalog-verso-recto";

/** Grille PDF « Noms & prix modèles » — prime sur le CRM tant que l’admin n’est pas aligné. */
export const DINGRY_STOREFRONT_PRICE_BY_ID: Readonly<Record<number, number>> = {
  1: 80,
  2: 80,
  3: 80,
  4: 90,
  5: 90,
  6: 80,
  7: 80,
  8: 80,
  11: 35,
  13: 35,
  17: 35,
  19: 35,
  21: 35,
  22: 35,
  23: 35,
  24: 35,
  25: 80,
  26: 80,
  27: 80,
  28: 80,
  29: 80,
  30: 80,
  31: 50,
  32: 50,
  33: 50,
  34: 50,
  35: 80,
  36: 80,
  37: 40,
  38: 40,
  39: 50,
  40: 50,
  41: 129,
  42: 129,
};

export function storefrontPriceForCatalogId(catalogId: number, fallbackPrice: number): number {
  const rectoId = resolveRectoCatalogId(catalogId);
  return DINGRY_STOREFRONT_PRICE_BY_ID[rectoId] ?? DINGRY_STOREFRONT_PRICE_BY_ID[catalogId] ?? fallbackPrice;
}

export function withStorefrontPrice<T extends { id: number; price: number }>(product: T): T {
  const price = storefrontPriceForCatalogId(product.id, product.price);
  return price === product.price ? product : { ...product, price };
}
