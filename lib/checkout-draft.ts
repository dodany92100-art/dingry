import type { ShopProduct } from "@/lib/catalog";

export const PERSONALIZATION_SURCHARGE_EUR = 5;
const CART_KEY = "dingry-cart";
const CONFIRMATION_KEY = "dingry-checkout-confirmation";
const PENDING_ORDER_KEY = "dingry-checkout-pending-order";

export type StoredCartItem = {
  product: ShopProduct;
  size: string;
  qty: number;
  personalization?: string;
  /** Clé option parent (`ROUGE`, `NOIR`…) — SKU combiné au checkout. */
  selectedOption?: string;
};

/** Clé stable panier / React : produit + taille (+ texte perso si besoin). */
export function cartLineKey(
  item: Pick<StoredCartItem, "product" | "size" | "personalization" | "selectedOption">,
): string {
  const size = item.size.trim();
  const perso = item.personalization?.trim();
  const opt = item.selectedOption?.trim().toUpperCase();
  if (perso) return `${item.product.id}-${size}-${perso}`;
  return opt ? `${item.product.id}-${size}-${opt}` : `${item.product.id}-${size}`;
}

export type CheckoutConfirmation = {
  orderId: string;
  payerName: string;
  email: string;
  total: number;
  items: string[];
  shippingName: string;
  shippingAddress: string;
};

export function cartUnitPrice(item: StoredCartItem): number {
  return item.product.price + (item.personalization ? PERSONALIZATION_SURCHARGE_EUR : 0);
}

function isShopProduct(value: unknown): value is ShopProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Record<string, unknown>;
  return (
    typeof product.id === "number" &&
    Number.isFinite(product.id) &&
    typeof product.name === "string" &&
    product.name.trim().length > 0 &&
    product.name.length <= 120 &&
    typeof product.variant === "string" &&
    product.variant.length <= 120 &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    product.price >= 0 &&
    product.price < 100000 &&
    typeof product.image === "string" &&
    product.image.length <= 500 &&
    typeof product.description === "string" &&
    product.description.length <= 800 &&
    typeof product.category === "string" &&
    product.category.length <= 40
  );
}

function isStoredCartItem(value: unknown): value is StoredCartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  const personalizationOk =
    item.personalization === undefined ||
    (typeof item.personalization === "string" && item.personalization.length <= 28);
  const selectedOptionOk =
    item.selectedOption === undefined ||
    (typeof item.selectedOption === "string" && item.selectedOption.trim().length > 0 && item.selectedOption.length <= 32);
  return (
    isShopProduct(item.product) &&
    typeof item.size === "string" &&
    item.size.trim().length > 0 &&
    item.size.length <= 12 &&
    typeof item.qty === "number" &&
    Number.isInteger(item.qty) &&
    item.qty > 0 &&
    item.qty <= 99 &&
    personalizationOk &&
    selectedOptionOk
  );
}

export function readStoredCart(): StoredCartItem[] {
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 50) return [];
    return parsed.every(isStoredCartItem) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStoredCart(cart: StoredCartItem[]): void {
  try {
    if (cart.length === 0) {
      sessionStorage.removeItem(CART_KEY);
      return;
    }
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // navigation privée : le panier reste en mémoire
  }
}

function isConfirmation(value: unknown): value is CheckoutConfirmation {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.orderId === "string" &&
    typeof record.payerName === "string" &&
    typeof record.email === "string" &&
    typeof record.total === "number" &&
    Number.isFinite(record.total) &&
    Array.isArray(record.items) &&
    record.items.every((item) => typeof item === "string") &&
    typeof record.shippingName === "string" &&
    typeof record.shippingAddress === "string"
  );
}

export function saveCheckoutConfirmation(confirmation: CheckoutConfirmation): void {
  try {
    sessionStorage.setItem(CONFIRMATION_KEY, JSON.stringify(confirmation));
  } catch {
    // la page de paiement affiche déjà la confirmation
  }
}

export function savePendingCheckoutOrder(orderId: string): void {
  try {
    sessionStorage.setItem(PENDING_ORDER_KEY, orderId);
  } catch {
    // navigation privée
  }
}

export function readPendingCheckoutOrder(): string | null {
  try {
    const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
    if (!raw || raw.length > 64) return null;
    return raw;
  } catch {
    return null;
  }
}

export function clearPendingCheckoutOrder(): void {
  try {
    sessionStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    // ignore
  }
}

export function consumeCheckoutConfirmation(): CheckoutConfirmation | null {
  try {
    const raw = sessionStorage.getItem(CONFIRMATION_KEY);
    sessionStorage.removeItem(CONFIRMATION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isConfirmation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
