import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import {
  DINGRY_HOODIE_BLACK_ORIGINAL_ID,
  DINGRY_HOODIE_BLACK_PARIS_ID,
} from "@/lib/shop-catalog";
import {
  catalogRectoId,
  colorLabelFromShopProduct,
  completeLookForProduct,
  productLineForShop,
  shopProductForRectoId,
  staticProductLineForCatalogId,
  storefrontProductTitle,
  type ProductLine,
} from "@/lib/dingry-product-display";

export const SIMILAR_PRODUCTS_SECTION_LABEL = "Produits similaires";

export type SimilarProductCard = {
  product: ShopProduct;
  label: string;
  isActive: boolean;
  comingSoon?: boolean;
};

function isRectoFacingProduct(product: ShopProduct): boolean {
  return !/\bVERSO\b/i.test(product.variant);
}

function shopProductFamilyKey(product: Pick<ShopProduct, "name" | "category">): string {
  const TRAILING_COLOR =
    /\s+(NOIR|BLACK|BLANC|WHITE|CHARCOAL|GRIS CHINÉ|GRIS CHINE|GREY|GRAY|VERT|ROUGE|KING BLUE|PINK|CHOCOLAT|BLEU ROI|ROYAL BLUE|JAUNE FLUO|PURPLE|ZENITH)\s*$/i;
  const category = String(product.category).trim().toUpperCase();
  let family = product.name.trim().replace(/\s+/g, " ").toUpperCase();
  family = family
    .replace(/\s+[A-Z0-9][A-Z0-9\s]*(?:\s*\/\s*[A-Z0-9][A-Z0-9\s]*)+\s*$/i, "")
    .trim();
  family = family.replace(TRAILING_COLOR, "").replace(/\s*\/\s*[^/]+$/i, "").trim();
  return `${category}::${family}`;
}

export function resolveProductLineForSimilar(
  productId: number,
  catalog: readonly ShopProduct[],
): ProductLine | null {
  const lineFromCatalog = productLineForShop(productId, catalog);
  if (lineFromCatalog && lineFromCatalog.variants.length > 1) {
    return lineFromCatalog;
  }
  const staticLine = staticProductLineForCatalogId(productId);
  if (!staticLine || staticLine.variants.length <= 1) {
    return lineFromCatalog;
  }
  const byRecto = new Map(catalog.map((item) => [catalogRectoId(item.id), item]));
  const variants = staticLine.variants.filter((variant) => byRecto.has(variant.rectoId));
  if (variants.length > 1) {
    return { ...staticLine, variants };
  }
  return lineFromCatalog;
}

function colorVariantIsActive(
  openRectoId: number,
  cardProduct: ShopProduct,
  staticVariantRectoId: number,
): boolean {
  const cardRecto = catalogRectoId(cardProduct.id);
  if (cardRecto === openRectoId) return true;
  if (
    staticVariantRectoId === DINGRY_HOODIE_BLACK_ORIGINAL_ID &&
    (openRectoId === DINGRY_HOODIE_BLACK_ORIGINAL_ID ||
      openRectoId === DINGRY_HOODIE_BLACK_PARIS_ID) &&
    (cardRecto === DINGRY_HOODIE_BLACK_ORIGINAL_ID || cardRecto === DINGRY_HOODIE_BLACK_PARIS_ID)
  ) {
    return true;
  }
  return staticVariantRectoId === openRectoId;
}

function familySiblingCards(productId: number, catalog: readonly ShopProduct[]): SimilarProductCard[] {
  const rectoId = catalogRectoId(productId);
  const anchor = catalog.find((item) => catalogRectoId(item.id) === rectoId);
  if (!anchor || !isRectoFacingProduct(anchor)) return [];
  const key = shopProductFamilyKey(anchor);
  const siblings = catalog
    .filter((item) => isRectoFacingProduct(item) && shopProductFamilyKey(item) === key)
  if (siblings.length <= 1) return [];
  return siblings.map((product) => ({
    product,
    label: colorLabelFromShopProduct(product),
    isActive: catalogRectoId(product.id) === rectoId,
    comingSoon: !isShopProductInStock(product),
  }));
}

function lineVariantCards(productId: number, catalog: readonly ShopProduct[]): SimilarProductCard[] {
  const rectoId = catalogRectoId(productId);
  const line = resolveProductLineForSimilar(productId, catalog);
  if (!line || line.variants.length <= 1) return [];
  return line.variants.flatMap((variant) => {
    const resolved = shopProductForRectoId(variant.rectoId, catalog);
    if (!resolved) return [];
    const { product, fromLive } = resolved;
    const variantRectoId = catalogRectoId(product.id);
    return [
      {
        product,
        label: variant.colorLabel,
        isActive: colorVariantIsActive(rectoId, product, variant.rectoId),
        comingSoon:
          variant.comingSoon ?? (!fromLive || !isShopProductInStock(product)),
      },
    ];
  });
}

function excludeActiveVariant(cards: SimilarProductCard[]): SimilarProductCard[] {
  return cards.filter((card) => !card.isActive);
}

/** Déclinaisons couleur du même modèle (y compris la fiche ouverte). */
export function shopProductColorVariants(
  productId: number,
  catalog: readonly ShopProduct[],
): SimilarProductCard[] {
  const fromLine = lineVariantCards(productId, catalog);
  if (fromLine.length > 1) return fromLine;
  return familySiblingCards(productId, catalog);
}

/** Déclinaisons même ligne / famille (hors fiche ouverte), sinon pièces complémentaires. */
export function similarProductsForShop(
  productId: number,
  catalog: readonly ShopProduct[],
): { variants: SimilarProductCard[]; crossSell: ShopProduct[] } {
  const rectoId = catalogRectoId(productId);
  if (shopProductColorVariants(productId, catalog).length > 1) {
    const crossSell = completeLookForProduct(productId, catalog).filter(
      (item) => catalogRectoId(item.id) !== rectoId,
    );
    return { variants: [], crossSell };
  }
  let variants = excludeActiveVariant(lineVariantCards(productId, catalog));
  if (variants.length === 0) {
    variants = excludeActiveVariant(familySiblingCards(productId, catalog));
  }
  if (variants.length > 0) {
    return { variants, crossSell: [] };
  }
  const crossSell = completeLookForProduct(productId, catalog).filter(
    (item) => catalogRectoId(item.id) !== rectoId,
  );
  return { variants: [], crossSell };
}

export function crossSellProductCaption(product: ShopProduct, catalog?: readonly ShopProduct[]): string {
  return storefrontProductTitle(product, catalog).replace(/\s*—\s*RECTO\s*/gi, "").trim();
}
