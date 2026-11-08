import type { ShopProduct } from "@/lib/catalog";
import { sortCatalogProducts } from "@/lib/catalog-sort";
import { cartUnitPrice, cartLineKey, type StoredCartItem } from "@/lib/checkout-draft";
import { isJerseyShopProduct, resolveJerseyProduct, type JerseyColorKey } from "@/lib/jersey-shop";
import { sellableSizes } from "@/lib/checkout-line-resolve";
import {
  HOODIE_PAIR_DEFS,
  IMAGES,
  PERSONALIZATION_MAX_LABEL_LENGTH,
  PRODUCTS,
  TEE_VERSO_BY_RECTO_ID,
} from "@/lib/shop-data";
import {
  filterCatalogProducts,
  isRectoVersoShopCategory,
  type CatalogFilter,
} from "@/lib/shop-catalog";
import { buildSweatCatalogPairs } from "@/lib/sweat-catalog-pairs";

export type CartLine = StoredCartItem;

export { cartLineKey };
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

/** Ajoute une ligne standard ; fusionne uniquement même id + taille (non personnalisée). */
export function addCartLine(
  cart: readonly CartLine[],
  product: ShopProduct,
  size: string,
  qty: number,
): CartLine[] {
  const normalizedSize = size.trim();
  if (!normalizedSize || qty <= 0) return [...cart];
  const key = cartLineKey({ product, size: normalizedSize });
  const existing = cart.find((line) => !line.personalization && cartLineKey(line) === key);
  if (existing) {
    return cart.map((line) =>
      line === existing ? { ...line, qty: line.qty + qty } : line,
    );
  }
  return [...cart, { product, size: normalizedSize, qty }];
}

/** Ajoute une ligne personnalisée ; fusionne si même clé (id + taille + texte). */
export function addPersonalizedCartLine(
  cart: readonly CartLine[],
  product: ShopProduct,
  size: string,
  qty: number,
  personalization: string,
): CartLine[] {
  const normalizedSize = size.trim();
  const perso = personalization.trim();
  if (!normalizedSize || !perso || qty <= 0) return [...cart];
  const key = cartLineKey({ product, size: normalizedSize, personalization: perso });
  const existing = cart.find((line) => cartLineKey(line) === key);
  if (existing) {
    return cart.map((line) => (line === existing ? { ...line, qty: line.qty + qty } : line));
  }
  return [...cart, { product, size: normalizedSize, qty, personalization: perso }];
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

/** Change la taille d'une ligne ; fusionne les quantités si la cible existe déjà. */
export function updateCartLineSize(cart: readonly CartLine[], index: number, newSize: string): CartLine[] {
  const line = cart[index];
  if (!line) return [...cart];
  const size = newSize.trim();
  if (!size || size === line.size) return [...cart];

  const targetKey = cartLineKey({ ...line, size });
  const next = [...cart];
  const duplicateIndex = next.findIndex((entry, i) => i !== index && cartLineKey(entry) === targetKey);

  if (duplicateIndex >= 0) {
    next[duplicateIndex] = { ...next[duplicateIndex], qty: next[duplicateIndex].qty + line.qty };
    next.splice(index, 1);
    return next;
  }

  next[index] = { ...line, size };
  return next;
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
  const crmBack = product.imageBack?.trim();
  if (crmBack) return crmBack;
  const pair = pairs.find((entry) => entry.recto.id === product.id);
  if (pair) return pair.verso.image;
  const tee = TEE_VERSO_BY_RECTO_ID[product.id];
  if (tee) return IMAGES[tee.image];
  return undefined;
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
  if (!isJerseyShopProduct(product)) return product;
  const jersey = resolveJerseyProduct(products, jerseyColor);
  return jersey ?? product;
}

export function modalSizesFor(product: ShopProduct): string[] {
  return sellableSizes(undefined, product);
}

export function sizeGridColumns(sizes: readonly string[]): 4 | 6 {
  return sizes.length <= 4 ? 4 : 6;
}
