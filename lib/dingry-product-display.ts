import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { printPlacementDisplayLabel } from "@/lib/admin/types";
import { productStoryForShopProduct, type ProductStoryBlock } from "@/lib/dingry-product-copy";
import { resolveRectoCatalogId } from "@/lib/catalog-verso-recto";

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
  variants: [{ rectoId: 4, colorLabel: "BLACK" }],
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

export function staticProductLineForCatalogId(productId: number): ProductLine | null {
  return LINE_BY_RECTO.get(catalogRectoId(productId)) ?? null;
}

/** @deprecated préférer {@link productLineForShop} avec le catalogue live */
export function productLineForCatalogId(productId: number): ProductLine | null {
  return staticProductLineForCatalogId(productId);
}

const TRAILING_COLOR =
  /\s+(NOIR|BLACK|BLANC|WHITE|CHARCOAL|GRIS CHINÉ|GRIS CHINE|GREY|GRAY|VERT|ROUGE|KING BLUE|PINK|CHOCOLAT|BLEU ROI|ROYAL BLUE|JAUNE FLUO|PURPLE|ZENITH)\s*$/i;

export function colorLabelFromShopProduct(product: ShopProduct): string {
  const variant = product.variant.trim();
  if (variant && !/\b(RECTO|VERSO)\b/i.test(variant)) {
    const cleaned = variant
      .replace(/\s*—\s*(RECTO|VERSO)\s*/gi, "")
      .replace(/\s*-\s*(RECTO|VERSO)\s*/gi, "")
      .trim();
    if (cleaned) return cleaned.toUpperCase();
  }
  const slash = product.name.split("/").pop()?.trim();
  if (slash && slash.length <= 24) return slash.toUpperCase();
  return variant.toUpperCase() || "STANDARD";
}

function shopProductFamilyKey(product: Pick<ShopProduct, "name" | "category">): string {
  const category = String(product.category).trim().toUpperCase();
  let family = product.name.trim().replace(/\s+/g, " ").toUpperCase();
  family = family.replace(TRAILING_COLOR, "").replace(/\s*\/\s*[^/]+$/i, "").trim();
  return `${category}::${family}`;
}

function shopProductFamilyDisplayName(name: string): string {
  return name.trim().replace(TRAILING_COLOR, "").replace(/\s*\/\s*[^/]+$/i, "").trim();
}

function isRectoFacingProduct(product: ShopProduct): boolean {
  return !/\bVERSO\b/i.test(product.variant);
}

function normalizeColorKey(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

function filterStaticLineToCatalog(
  staticLine: ProductLine | null,
  catalog: readonly ShopProduct[],
): ProductLine | null {
  if (!staticLine) return null;
  const byId = new Map(catalog.map((item) => [catalogRectoId(item.id), item]));
  const variants = staticLine.variants.filter((variant) => {
    if (variant.comingSoon) return false;
    const item = byId.get(variant.rectoId);
    if (!item) return false;
    return isRectoFacingProduct(item);
  });
  if (variants.length === 0) return null;
  return { ...staticLine, variants };
}

function dedupeVariantsByColor(variants: ProductLineVariant[]): ProductLineVariant[] {
  const byColor = new Map<string, ProductLineVariant>();
  for (const variant of variants) {
    const key = normalizeColorKey(variant.colorLabel);
    const existing = byColor.get(key);
    if (!existing) {
      byColor.set(key, variant);
      continue;
    }
    if (existing.comingSoon && !variant.comingSoon) {
      byColor.set(key, variant);
    }
  }
  return [...byColor.values()];
}

export function productLineForShop(
  productId: number,
  catalog: readonly ShopProduct[],
): ProductLine | null {
  const staticLine = staticProductLineForCatalogId(productId);
  const rectoId = catalogRectoId(productId);
  const anchor = catalog.find((item) => catalogRectoId(item.id) === rectoId);
  if (!anchor || !isRectoFacingProduct(anchor)) {
    return filterStaticLineToCatalog(staticLine, catalog);
  }

  const familyKey = shopProductFamilyKey(anchor);
  const familyProducts = catalog.filter(
    (item) => isRectoFacingProduct(item) && shopProductFamilyKey(item) === familyKey,
  );

  const declinationSource =
    anchor.colorDeclinations && anchor.colorDeclinations.length > 0
      ? anchor.colorDeclinations
      : familyProducts.map((item) => colorLabelFromShopProduct(item));

  const colorLabels = Array.from(
    new Set(declinationSource.map((item) => item.trim()).filter(Boolean)),
  );
  if (colorLabels.length === 0) {
    colorLabels.push(colorLabelFromShopProduct(anchor));
  }

  const variants: ProductLineVariant[] = colorLabels.flatMap((colorLabel) => {
    const match = familyProducts.find(
      (item) => normalizeColorKey(colorLabelFromShopProduct(item)) === normalizeColorKey(colorLabel),
    );
    if (!match) return [];
    return [
      {
        rectoId: catalogRectoId(match.id),
        colorLabel: colorLabel.toUpperCase(),
        comingSoon: !isShopProductInStock(match),
      },
    ];
  });

  const deduped = dedupeVariantsByColor(variants);
  if (deduped.length === 0) {
    return filterStaticLineToCatalog(staticLine, catalog);
  }

  return {
    lineId: familyKey,
    familyLabel: shopProductFamilyDisplayName(anchor.name),
    price: anchor.price,
    materials: anchor.materials?.trim() || staticLine?.materials || DINGRY_HOODIE_MATERIALS,
    sizeGuide: anchor.sizeGuide?.trim() || staticLine?.sizeGuide || DINGRY_SIZE_GUIDE,
    description: anchor.description?.trim() || staticLine?.description || "",
    variants: deduped,
    completeLookRectoIds: staticLine?.completeLookRectoIds ?? [],
  };
}

export function storefrontProductTitle(
  product: ShopProduct,
  catalog?: readonly ShopProduct[],
): string {
  const rectoId = catalogRectoId(product.id);
  const line = catalog ? productLineForShop(product.id, catalog) : staticProductLineForCatalogId(product.id);
  if (line) {
    const variant = line.variants.find((item) => item.rectoId === rectoId);
    const color = variant?.colorLabel ?? colorLabelFromShopProduct(product);
    return `${line.familyLabel} ${color}`.trim();
  }
  if (product.variant && /\b(RECTO|VERSO)\b/i.test(product.variant)) {
    return product.name;
  }
  const color = colorLabelFromShopProduct(product);
  if (color && color !== "STANDARD") {
    return `${shopProductFamilyDisplayName(product.name)} ${color}`.trim();
  }
  return product.name;
}

/** Sous-titre carte : vide si le titre porte déjà le coloris. */
export function storefrontProductSubtitle(product: ShopProduct): string {
  const line = productLineForCatalogId(product.id);
  if (line) return "";
  return product.variant.replace(/\s*—\s*(RECTO|VERSO)\s*/gi, " ").trim();
}

export function productDetailCopy(
  product: ShopProduct,
  catalog?: readonly ShopProduct[],
): ProductStoryBlock & { description: string; printPlacement?: string } {
  const story = productStoryForShopProduct(product);
  const line = catalog
    ? productLineForShop(product.id, catalog)
    : staticProductLineForCatalogId(product.id);
  const lead = adminLeadFromProduct(product, story);
  const printPlacement = product.printPlacement
    ? printPlacementDisplayLabel(product.printPlacement)
    : undefined;
  return {
    lead,
    description: lead,
    fabrication: product.fabrication?.trim() || story.fabrication,
    limitedEdition: product.limitedEdition?.trim() || story.limitedEdition,
    materials: product.materials?.trim() || line?.materials || story.materials,
    sizeGuide: product.sizeGuide?.trim() || line?.sizeGuide || story.sizeGuide,
    ...(printPlacement ? { printPlacement } : {}),
  };
}

function adminLeadFromProduct(product: ShopProduct, story: ProductStoryBlock): string {
  const description = product.description?.trim();
  if (!description) return story.lead;
  const hasCrmBlocks =
    Boolean(product.fabrication?.trim()) ||
    Boolean(product.limitedEdition?.trim()) ||
    Boolean(product.materials?.trim()) ||
    Boolean(product.sizeGuide?.trim());
  if (hasCrmBlocks || description.length >= 100) return description;
  return story.lead;
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
