import type { ShopProduct } from "@/lib/catalog";
import {
  catalogRectoId,
  colorLabelFromShopProduct,
  productLineForShop,
  storefrontProductTitle,
} from "@/lib/dingry-product-display";
import { SHIPPING_FREE_THRESHOLD } from "@/lib/storefront/shipping-free-threshold";

/** Titre PDP : famille / ligne, sans répéter tout le libellé carte si possible. */
export function pdpDisplayTitle(product: ShopProduct, catalog?: readonly ShopProduct[]): string {
  const line = catalog ? productLineForShop(product.id, catalog) : null;
  if (line?.familyLabel.trim()) return line.familyLabel.trim();
  return storefrontProductTitle(product, catalog) || product.name.trim();
}

const normalizePart = (value: string): string => value.replace(/\s+/g, " ").trim();

/** Sous-titre : couleur / coupe (sizeGuide CRM) / matière — champs produit uniquement, pas de story. */
export function pdpSubtitle(product: ShopProduct, catalog?: readonly ShopProduct[]): string {
  const parts: string[] = [];

  const line = catalog ? productLineForShop(product.id, catalog) : null;
  if (line) {
    const rectoId = catalogRectoId(product.id);
    const variant = line.variants.find((item) => item.rectoId === rectoId);
  const color = variant?.colorLabel?.trim();
    if (color) parts.push(color);
  } else {
    const color = colorLabelFromShopProduct(product);
    if (color && color !== "STANDARD") parts.push(color);
  }

  const sizeGuide = product.sizeGuide?.trim();
  if (sizeGuide) parts.push(sizeGuide);

  const materials = product.materials?.trim();
  if (materials) parts.push(materials);

  return parts.map(normalizePart).filter(Boolean).join(" / ");
}

export function shouldShowPdpColorSwatches(variantCount: number): boolean {
  return variantCount > 1;
}

/** Badge édition limitée : texte CRM produit seulement (pas fallback story). */
export function pdpLimitedEditionBadge(product: Pick<ShopProduct, "limitedEdition">): string | null {
  const value = product.limitedEdition?.trim();
  return value ? value : null;
}

export function pdpKeySellingPoints(product: ShopProduct): string[] {
  const points: string[] = [];
  const fabrication = product.fabrication?.trim();
  if (fabrication) points.push(fabrication);
  const materials = product.materials?.trim();
  if (materials && !points.includes(materials)) points.push(materials);
  return points;
}

export function hasPdpSizeGuide(sizeGuideCopy: string | undefined): boolean {
  return Boolean(sizeGuideCopy?.trim());
}

export function showPdpFreeShippingReassurance(threshold: number | null = SHIPPING_FREE_THRESHOLD): boolean {
  return typeof threshold === "number" && Number.isFinite(threshold) && threshold > 0;
}

export function pdpFreeShippingMessage(threshold: number, locale: "fr" | "en" = "fr"): string {
  const amount = Math.round(threshold);
  if (locale === "en") return `Free delivery from ${amount}€`;
  return `Livraison offerte dès ${amount}€`;
}

export const PDP_SECURE_PAYMENT_FR = "Paiement sécurisé";
export const PDP_SECURE_PAYMENT_EN = "Secure payment";

export const PDP_CHOOSE_SIZE_FR = "Choisissez une taille";
export const PDP_ADDED_FR = "Ajouté au panier";

/** Fiche produit #24 : bouton CUSTOM configurateur (cahier 23/11/2026). */
export const PDP_CUSTOM_PRODUCT_ID = 24;

export function showPdpCustomButton(productId: number): boolean {
  return productId === PDP_CUSTOM_PRODUCT_ID;
}
