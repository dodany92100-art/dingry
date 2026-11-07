import {
  defaultSizesForCategory,
  isProductCategory,
  isProductSize,
  type AdminProduct,
} from "@/lib/admin/types";
import { resolveRectoCatalogId } from "@/lib/catalog-verso-recto";
export type CheckoutLine = {
  productId: number;
  size: string;
  qty: number;
  personalization?: string;
};
import { normalizePantWaistSize } from "@/lib/admin/pant-waist";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
import type { ShopProduct } from "@/lib/catalog";
import {
  type ShopCatalogSnapshot,
  isCatalogLineSellable,
  snapshotShopProduct,
} from "@/lib/shop-catalog-snapshot";
import { SIZES } from "@/lib/shop-data";

const PERSONALIZABLE_PRODUCT_ID = 24;

/** Dernières refs sans fiche CRM — prix figés checkout uniquement. */
export const VITRINE_ONLY: Record<number, { name: string; variant: string; price: number }> = {
  1: { name: "Hoodie DINGRY Original KING BLUE / PINK", variant: "VERSO", price: 80 },
  3: { name: "Hoodie DINGRY Original VERT", variant: "VERSO", price: 80 },
  5: { name: "Hoodie zippé DINGRY Outline / BLACK", variant: "VERSO", price: 90 },
  8: { name: "Hoodie DINGRY Original BLACK", variant: "VERSO", price: 80 },
  18: { name: "DINGRY TEE", variant: "COLLECTION 08 — VERSO", price: 35 },
  20: { name: "DINGRY TEE", variant: "COLLECTION 10 — VERSO", price: 35 },
};

export type CheckoutLineRejectReason =
  | "removed"
  | "unknown_product"
  | "invalid_size"
  | "invalid_personalization"
  | "invalid_price";

export type ResolvedCheckoutLine = {
  label: string;
  paypalName: string;
  unitCents: number;
  qty: number;
};

function vitrineFallback(productId: number, rectoId: number) {
  return VITRINE_ONLY[productId] ?? (rectoId !== productId ? VITRINE_ONLY[rectoId] : undefined);
}

function crmLiveProduct(
  snapshot: ShopCatalogSnapshot,
  productId: number,
  rectoId: number,
): AdminProduct | undefined {
  const row = snapshot.adminById.get(productId) ?? snapshot.adminById.get(rectoId);
  return row?.publishStatus === "live" ? row : undefined;
}

/** Grille vendable : CRM live → vitrine → défaut catégorie. */
export function sellableSizes(crmLive: AdminProduct | undefined, shop: ShopProduct | undefined): string[] {
  if (crmLive && crmLive.sizes.length > 0) return crmLive.sizes;
  if (shop?.sizes && shop.sizes.length > 0) return shop.sizes;
  if (crmLive && isProductCategory(crmLive.category)) {
    return [...defaultSizesForCategory(crmLive.category)];
  }
  return [...SIZES];
}

function lineSizeAllowed(sizes: readonly string[], size: string): boolean {
  const waist = normalizePantWaistSize(size);
  const candidates = waist ? [size.trim(), waist] : [size.trim()];
  return candidates.some((candidate) => sizes.includes(candidate));
}

function priceToCents(price: number): number | null {
  if (!Number.isFinite(price) || price <= 0 || price >= 100_000) return null;
  const cents = Math.round(price * 100);
  if (Math.abs(price * 100 - cents) > 0.001) return null;
  return cents;
}

export function resolveCheckoutLine(
  line: CheckoutLine,
  snapshot: ShopCatalogSnapshot,
): { ok: true; line: ResolvedCheckoutLine } | { ok: false; reason: CheckoutLineRejectReason } {
  if (!isCatalogLineSellable(snapshot, line.productId)) {
    return { ok: false, reason: "removed" };
  }

  const rectoId = resolveRectoCatalogId(line.productId);
  const crmLive = crmLiveProduct(snapshot, line.productId, rectoId);
  const shop = snapshotShopProduct(snapshot, line.productId, rectoId);
  const fallback = crmLive || shop ? undefined : vitrineFallback(line.productId, rectoId);

  const name = crmLive?.name ?? shop?.name ?? fallback?.name;
  const variant = crmLive?.variant ?? shop?.variant ?? fallback?.variant ?? "";
  const price = crmLive?.price ?? shop?.price ?? fallback?.price;
  if (!name || price === undefined) {
    return { ok: false, reason: "unknown_product" };
  }

  const sizes = sellableSizes(crmLive, shop);
  if (crmLive || shop) {
    if (!lineSizeAllowed(sizes, line.size)) {
      return { ok: false, reason: "invalid_size" };
    }
  } else if (fallback) {
    if (!isProductSize(line.size)) {
      return { ok: false, reason: "invalid_size" };
    }
  } else {
    return { ok: false, reason: "unknown_product" };
  }

  const baseCents = priceToCents(price);
  if (baseCents === null) {
    return { ok: false, reason: "invalid_price" };
  }

  const personalized = line.personalization !== undefined;
  if (personalized && line.productId !== PERSONALIZABLE_PRODUCT_ID) {
    return { ok: false, reason: "invalid_personalization" };
  }

  const unitCents = baseCents + (personalized ? PERSONALIZATION_SURCHARGE_EUR * 100 : 0);

  const label = `${name}${variant ? ` — ${variant}` : ""}`.slice(0, 120);
  const detail = personalized ? `${label} — ${line.personalization}` : label;

  return {
    ok: true,
    line: {
      label: `${detail} — ${line.size} ×${line.qty}`.slice(0, 180),
      paypalName: (personalized ? `${name} perso` : `${name} ${variant}`).trim().slice(0, 127),
      unitCents,
      qty: line.qty,
    },
  };
}
