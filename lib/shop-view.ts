import type { ShopProduct } from "@/lib/catalog";
import { sortCatalogProducts } from "@/lib/catalog-sort";
import { cartUnitPrice, type StoredCartItem } from "@/lib/checkout-draft";
import { isJerseyShopProduct, resolveJerseyProduct, type JerseyColorKey } from "@/lib/jersey-shop";
import {
  HOODIE_PAIR_DEFS,
  IMAGES,
  PERSONALIZABLE_PRODUCT_ID,
  PERSONALIZATION_MAX_LABEL_LENGTH,
  PRODUCTS,
  SIZES,
  TEE_VERSO_BY_RECTO_ID,
} from "@/lib/shop-data";
import {
  filterCatalogProducts,
  isRectoVersoShopCategory,
  type CatalogFilter,
} from "@/lib/shop-catalog";
import { buildSweatCatalogPairs } from "@/lib/sweat-catalog-pairs";

export type CartLine = StoredCartItem;
export type FlipPair = { recto: ShopProduct; verso: ShopProduct };

/* ---------- Panier (fonctions pures) ---------- */

export function lineUnitPrice(line: CartLine): number {
  return cartUnitPrice(line);
}

export function cartItemCount(cart: readonly CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.qty, 0);
}

export function cartSubtotal(cart: readonly CartLine[]): number {
  return cart.reduce((sum, line) => sum + lineUnitPrice(line) * line.qty, 0);
}

/** Ajoute une ligne standard ; fusionne avec une ligne identique non personnalisée. */
export function addCartLine(
  cart: readonly CartLine[],
  product: ShopProduct,
  size: string,
  qty: number,
): CartLine[] {
  const existing = cart.find(
    (line) => line.product.id === product.id && line.size === size && !line.personalization,
  );
  if (existing) {
    return cart.map((line) => (line === existing ? { ...line, qty: line.qty + qty } : line));
  }
  return [...cart, { product, size, qty }];
}

/** Ajoute une ligne personnalisée ; fusionne si même taille et même texte. */
export function addPersonalizedCartLine(
  cart: readonly CartLine[],
  product: ShopProduct,
  size: string,
  qty: number,
  personalization: string,
): CartLine[] {
  const existing = cart.find(
    (line) =>
      line.product.id === PERSONALIZABLE_PRODUCT_ID &&
      line.size === size &&
      line.personalization === personalization,
  );
  if (existing) {
    return cart.map((line) => (line === existing ? { ...line, qty: line.qty + qty } : line));
  }
  return [...cart, { product, size, qty, personalization }];
}

export function updateCartLineQuantity(cart: readonly CartLine[], index: number, delta: number): CartLine[] {
  return cart.flatMap((line, i) => {
    if (i !== index) return [line];
    const nextQty = line.qty + delta;
    return nextQty > 0 ? [{ ...line, qty: nextQty }] : [];
  });
}

export function removeCartLine(cart: readonly CartLine[], index: number): CartLine[] {
  return cart.filter((_, i) => i !== index);
}

/* ---------- Personnalisation ---------- */

export function clampPersonalizationLabel(value: string): string {
  return value.slice(0, PERSONALIZATION_MAX_LABEL_LENGTH);
}

export function personalizationPreviewLabel(label: string): string {
  return label.trim().slice(0, PERSONALIZATION_MAX_LABEL_LENGTH).toUpperCase() || "PARIS";
}

/** Ligne stockée dans le panier, ou null si le texte est vide. */
export function personalizationLine(label: string, shirtLabel: string): string | null {
  const text = label.trim().slice(0, PERSONALIZATION_MAX_LABEL_LENGTH);
  return text ? `${text} — ${shirtLabel} (recto)` : null;
}

/* ---------- Catalogue ---------- */

export function visibleCatalogProducts(products: ShopProduct[], filter: CatalogFilter): ShopProduct[] {
  return sortCatalogProducts(filterCatalogProducts(products, filter), "featured");
}

export function buildFlipPairs(products: ShopProduct[]): FlipPair[] {
  const hoodiePairs: FlipPair[] = HOODIE_PAIR_DEFS.flatMap((pair) => {
    const recto =
      products.find((item) => item.id === pair.rectoId) ?? PRODUCTS.find((item) => item.id === pair.rectoId);
    const verso =
      products.find((item) => item.id === pair.versoId) ?? PRODUCTS.find((item) => item.id === pair.versoId);
    if (!recto || !verso) return [];
    return [{ recto, verso }];
  });
  return [...hoodiePairs, ...buildSweatCatalogPairs(products, PRODUCTS)];
}

export function catalogBackImageForRecto(product: ShopProduct, pairs: readonly FlipPair[]): string | undefined {
  const pair = pairs.find((entry) => entry.recto.id === product.id);
  if (pair) return pair.verso.image;
  const tee = TEE_VERSO_BY_RECTO_ID[product.id];
  if (tee) return IMAGES[tee.image];
  return undefined;
}

export function firstSwipeHintIndex(products: readonly ShopProduct[], pairs: readonly FlipPair[]): number {
  return products.findIndex((product) => catalogBackImageForRecto(product, pairs) !== undefined);
}

export function findActiveFlipPair(product: ShopProduct | null, pairs: readonly FlipPair[]): FlipPair | undefined {
  if (!product || !isRectoVersoShopCategory(product.category)) return undefined;
  return pairs.find((pair) => pair.verso.id === product.id || pair.recto.id === product.id);
}

/** Produit réellement vendu (jersey : selon la couleur choisie). */
export function resolveSaleProduct(
  product: ShopProduct,
  products: ShopProduct[],
  jerseyColor: JerseyColorKey,
): ShopProduct {
  return isJerseyShopProduct(product) ? (resolveJerseyProduct(products, jerseyColor) ?? product) : product;
}

export function modalSizesFor(product: ShopProduct): string[] {
  return product.sizes && product.sizes.length > 0 ? product.sizes : [...SIZES];
}

export function sizeGridColumns(sizes: readonly string[]): 4 | 6 {
  return sizes.length <= 4 ? 4 : 6;
}
