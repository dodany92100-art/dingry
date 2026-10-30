export const PRODUCT_SIZES = ["S", "M", "L", "XL", "TU"] as const;

export type ProductSize = (typeof PRODUCT_SIZES)[number];

export type OrderStatus = "En attente" | "Expédié" | "Livré" | "À vérifier";

/** Chaîne du bouton « avancer le statut » (sans « À vérifier »). */
export const FULFILLMENT_STATUSES: OrderStatus[] = ["En attente", "Expédié", "Livré"];

export const ORDER_STATUSES: OrderStatus[] = [...FULFILLMENT_STATUSES, "À vérifier"];

/** Catégories admin (back-office). Libellé boutique : voir `lib/shop-catalog.ts`. */
export const PRODUCT_CATEGORIES = ["Tee", "Hoodie", "Hoodie zippé", "Sweats", "Caps", "Jersey"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type AdminProduct = {
  id: string;
  sku: string;
  name: string;
  variant: string;
  description: string;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  stock: number;
  imageUrl: string;
  blobUrl: string | null;
  blobPathname: string | null;
  createdAt: string;
};

export type CatalogProduct = {
  id: number;
  sku: string;
  name: string;
  variant: string;
  description: string;
  category: ProductCategory;
  price: number;
  image: string;
  sizes: ProductSize[];
  stock: number;
};

export type AdminOrder = {
  id: string;
  customerName: string;
  email: string;
  total: number;
  items: string[];
  status: OrderStatus;
  createdAt: string;
  source: "paypal" | "demo";
  shippingName?: string;
  shippingAddress?: string;
  captureId?: string;
  /** Lignes utilisées pour le décrément Redis (reconciliation). */
  stockLines?: { productId: number; qty: number }[];
  /** Décrément Redis en attente ou en échec. */
  stockPending?: boolean;
  /** Décrément Redis confirmé (double garde-fou avec dingry:stock-applied). */
  stockApplied?: boolean;
};

export type AdminStore = {
  version: number;
  products: AdminProduct[];
  orders: AdminOrder[];
};

export const STORE_VERSION = 4;

export function isProductSize(value: string): value is ProductSize {
  return (PRODUCT_SIZES as readonly string[]).includes(value);
}

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function nextOrderStatus(status: OrderStatus): OrderStatus {
  if (status === "À vérifier") {
    return status;
  }
  const index = FULFILLMENT_STATUSES.indexOf(status);
  if (index < 0) return "En attente";
  return FULFILLMENT_STATUSES[(index + 1) % FULFILLMENT_STATUSES.length];
}

export function toCatalogProduct(product: AdminProduct): CatalogProduct | null {
  const id = Number(product.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return {
    id,
    sku: product.sku,
    name: product.name,
    variant: product.variant,
    description: product.description,
    category: product.category,
    price: product.price,
    image: product.imageUrl,
    sizes: product.sizes,
    stock: product.stock,
  };
}
