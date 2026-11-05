import { productStoryForShopProduct, type ProductStoryBlock } from "@/lib/dingry-product-copy";
import { resolveRectoCatalogId } from "@/lib/catalog-verso-recto";
import type { ShopProduct } from "@/lib/catalog";

export const DINGRY_SIZE_GUIDE =
  "Coupe oversize unisexe. Prenez votre taille habituelle pour un fit relaxed ; une taille en dessous pour un porté plus près du corps.";

export const DINGRY_HOODIE_MATERIALS =
  "Coton premium 480 g/m², intérieur gratté, capuche doublée, finitions ton sur ton.";

export type ProductLineVariant = {
  rectoId: number;
  colorLabel: string;
  comingSoon?: boolean;
};

export type ProductLine = {
  lineId: string;
  familyLabel: string;
  price: number;
  materials: string;
  sizeGuide: string;
  description: string;
  variants: ProductLineVariant[];
  completeLookRectoIds: number[];
};

const ORIGINAL_HOODIE_LINE: ProductLine = {
  lineId: "hoodie-original",
  familyLabel: "Hoodie DINGRY Original",
  price: 80,
  materials: DINGRY_HOODIE_MATERIALS,
  sizeGuide: DINGRY_SIZE_GUIDE,
  description:
    "Le hoodie signature DINGRY : coupe oversize, logo poitrine et statement au dos. Édition limitée, plusieurs coloris.",
  variants: [
    { rectoId: 6, colorLabel: "BLACK" },
    { rectoId: 2, colorLabel: "KING BLUE / PINK" },
    { rectoId: 7, colorLabel: "VERT" },
    { rectoId: 29, colorLabel: "CHOCOLAT" },
    { rectoId: 27, colorLabel: "GREY" },
    { rectoId: 35, colorLabel: "WHITE" },
  ],
  completeLookRectoIds: [37, 21, 11],
};

const ZIP_OUTLINE_LINE: ProductLine = {
  lineId: "hoodie-zip-outline",
  familyLabel: "Hoodie zippé DINGRY Outline",
  price: 90,
  materials: "Coton 450 g/m², fermeture YKK, broderies outline contrastées.",
  sizeGuide: DINGRY_SIZE_GUIDE,
  description: "Silhouette zippée structurée, détails outline et finitions premium.",
  variants: [
    { rectoId: 4, colorLabel: "BLACK" },
    { rectoId: 43, colorLabel: "CHARCOAL", comingSoon: true },
    { rectoId: 44, colorLabel: "GRIS CHINÉ", comingSoon: true },
  ],
  completeLookRectoIds: [37, 21],
};

export const DINGRY_PRODUCT_LINES: readonly ProductLine[] = [ORIGINAL_HOODIE_LINE, ZIP_OUTLINE_LINE];

const LINE_BY_RECTO = new Map<number, ProductLine>();
for (const line of DINGRY_PRODUCT_LINES) {
  for (const variant of line.variants) {
    LINE_BY_RECTO.set(variant.rectoId, line);
  }
}

export function catalogRectoId(productId: number): number {
  return resolveRectoCatalogId(productId);
}

export function productLineForCatalogId(productId: number): ProductLine | null {
  return LINE_BY_RECTO.get(catalogRectoId(productId)) ?? null;
}

export function storefrontProductTitle(product: ShopProduct): string {
  const rectoId = catalogRectoId(product.id);
  const line = LINE_BY_RECTO.get(rectoId);
  if (!line) {
    if (product.variant && /\b(RECTO|VERSO)\b/i.test(product.variant)) {
      return product.name;
    }
    return product.variant ? `${product.name} · ${product.variant}` : product.name;
  }
  const variant = line.variants.find((item) => item.rectoId === rectoId);
  if (!variant) return line.familyLabel;
  return `${line.familyLabel} ${variant.colorLabel}`;
}

/** Sous-titre carte : vide si le titre porte déjà le coloris. */
export function storefrontProductSubtitle(product: ShopProduct): string {
  const line = productLineForCatalogId(product.id);
  if (line) return "";
  return product.variant.replace(/\s*—\s*(RECTO|VERSO)\s*/gi, " ").trim();
}

export function productDetailCopy(product: ShopProduct): ProductStoryBlock & { description: string } {
  const story = productStoryForShopProduct(product);
  const line = productLineForCatalogId(product.id);
  return {
    ...story,
    description: story.lead,
    materials: line?.materials ?? story.materials,
    sizeGuide: line?.sizeGuide ?? story.sizeGuide,
  };
}

export function completeLookForProduct(
  productId: number,
  catalog: readonly ShopProduct[],
): ShopProduct[] {
  const line = productLineForCatalogId(productId);
  if (!line) return [];
  const byId = new Map(catalog.map((item) => [item.id, item]));
  return line.completeLookRectoIds
    .map((rectoId) => byId.get(rectoId))
    .filter((item): item is ShopProduct => item !== undefined);
}
