import type { ShopProduct } from "@/lib/catalog";
import { DINGRY_SWEAT_CATALOG } from "@/lib/dingry-product-media";

export type SweatCatalogPair = {
  id: number;
  color: string;
  reference: string;
  rectoId: number;
  versoId: number;
  recto: ShopProduct;
  verso: ShopProduct;
};

/** Construit les paires Sweats avec URLs canoniques (5028 / 6684), indépendamment de l’admin. */
export function buildSweatCatalogPairs(
  products: ShopProduct[],
  fallback: ShopProduct[],
): SweatCatalogPair[] {
  return DINGRY_SWEAT_CATALOG.flatMap((entry) => {
    const rectoBase =
      products.find((item) => item.id === entry.rectoId) ??
      fallback.find((item) => item.id === entry.rectoId);
    if (!rectoBase) return [];

    const recto: ShopProduct = {
      ...rectoBase,
      name: entry.title,
      category: "Sweats",
      image: entry.rectoImage,
      description: entry.description,
    };

    const versoBase =
      products.find((item) => item.id === entry.versoId) ??
      fallback.find((item) => item.id === entry.versoId);

    const verso: ShopProduct = {
      ...(versoBase ?? rectoBase),
      id: entry.versoId,
      name: entry.title,
      category: "Sweats",
      image: entry.versoImage,
      variant: versoBase?.variant ?? "VERSO",
      description: "",
    };

    return [
      {
        id: entry.pairId,
        color: entry.title,
        reference: entry.reference,
        rectoId: entry.rectoId,
        versoId: entry.versoId,
        recto,
        verso,
      },
    ];
  });
}
