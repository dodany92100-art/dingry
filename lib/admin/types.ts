import { PANT_WAIST_PRESET_SIZES, isValidPantWaistSize, normalizePantWaistSize } from "@/lib/admin/pant-waist";

/** Grille admin + Smart collage (2XL–5XL, XXS). */
export const PRODUCT_SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "TU",
] as const;

/** @deprecated alias — presets grille pantalon */
export const PANT_WAIST_SIZES = PANT_WAIST_PRESET_SIZES;

export type PantWaistSize = (typeof PANT_WAIST_PRESET_SIZES)[number];

/** Tailles catalogue : lettres + tours pantalon (presets ou personnalisés validés). */
export type ProductSize = (typeof PRODUCT_SIZES)[number] | string;

export type OrderStatus = "En attente" | "Expédié" | "Livré" | "À vérifier";

/** Chaîne du bouton « avancer le statut » (sans « À vérifier »). */
export const FULFILLMENT_STATUSES: OrderStatus[] = ["En attente", "Expédié", "Livré"];

export const ORDER_STATUSES: OrderStatus[] = [...FULFILLMENT_STATUSES, "À vérifier"];

/** Catégories admin — alignées taxonomie officielle (`lib/dingry-product-taxonomy.ts`). */
export {
  OFFICIAL_PRODUCT_CATEGORIES as PRODUCT_CATEGORIES,
  type OfficialProductCategory as ProductCategory,
} from "@/lib/dingry-product-taxonomy";
import type { OfficialProductCategory as ProductCategory } from "@/lib/dingry-product-taxonomy";
import { OFFICIAL_PRODUCT_CATEGORIES as PRODUCT_CATEGORIES } from "@/lib/dingry-product-taxonomy";

const LEGACY_PRODUCT_CATEGORY: Record<string, ProductCategory> = {
  Tee: "T-shirts",
  Hoodie: "Hoodies",
  "Hoodie zippé": "Hoodies zippés",
  Sweats: "Crewnecks",
  Jersey: "Jerseys",
};

/** Normalise anciennes fiches CRM + valeurs boutique. */
export function normalizeProductCategory(value: string): ProductCategory {
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(value)) return value as ProductCategory;
  return LEGACY_PRODUCT_CATEGORY[value] ?? "T-shirts";
}

/** Tailles proposées dans le formulaire admin par catégorie. */
export const ADMIN_CATEGORY_SIZES: Record<ProductCategory, readonly ProductSize[]> = {
  Hoodies: PRODUCT_SIZES,
  "Hoodies zippés": PRODUCT_SIZES,
  Crewnecks: PRODUCT_SIZES,
  "T-shirts": PRODUCT_SIZES,
  Jerseys: PRODUCT_SIZES,
  Pants: PANT_WAIST_PRESET_SIZES,
  "Crop tops": ["S", "M", "L", "XL"],
  Caps: ["TU"],
};

export function defaultSizesForCategory(category: ProductCategory): ProductSize[] {
  if (category === "Caps") return ["TU"];
  if (category === "Pants") return ["32"];
  const base: ProductSize[] = ["S", "M", "L", "XL"];
  const allowed = ADMIN_CATEGORY_SIZES[category];
  return base.filter((s) => allowed.includes(s));
}


export type ProductPublishStatus = "draft" | "live";

/** Image locale tant qu’aucune photo n’est uploadée (brouillon admin). */
export const DRAFT_PRODUCT_PLACEHOLDER_IMAGE = "/dingry-draft-product.svg";

export function normalizePublishStatus(value: unknown): ProductPublishStatus {
  return value === "draft" ? "draft" : "live";
}

export function parseColorDeclinations(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        raw
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }
  if (typeof raw === "string") {
    return Array.from(
      new Set(
        raw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }
  return [];
}

export function isDraftPlaceholderImage(imageUrl: string): boolean {
  return imageUrl.trim() === DRAFT_PRODUCT_PLACEHOLDER_IMAGE;
}

export type AdminProduct = {
  id: string;
  sku: string;
  name: string;
  variant: string;
  description: string;
  fabrication: string;
  limitedEdition: string;
  materials: string;
  sizeGuide: string;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  stock: number;
  publishStatus: ProductPublishStatus;
  /** Coloris proposés dans le modal boutique (déclinaisons). Vide = variante seule. */
  colorDeclinations: string[];
  imageUrl: string;
  blobUrl: string | null;
  blobPathname: string | null;
  createdAt: string;
  /** Épinglé en tête de sa catégorie (admin + boutique). */
  isPinned: boolean;
  /** Priorité manuelle (drag-and-drop admin) ; plus petit = plus haut. */
  displayOrder: number;
};

export type CatalogProduct = {
  id: number;
  sku: string;
  name: string;
  variant: string;
  description: string;
  fabrication?: string;
  limitedEdition?: string;
  materials?: string;
  sizeGuide?: string;
  category: ProductCategory;
  price: number;
  image: string;
  sizes: ProductSize[];
  /** Coloris modal boutique (recto CRM associés par famille + nom). */
  colorDeclinations?: string[];
  /** Absent si la source publique n’a pas d’info stock (devis serveur tranche). */
  stock?: number;
  isPinned?: boolean;
  displayOrder?: number;
  adminCreatedAt?: string;
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
  /** Motifs du statut « À vérifier » (cumulables). */
  reviewReasons?: ("stock" | "adresse")[];
};

export type AdminLookbookSlide = {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  blobUrl: string | null;
  blobPathname: string | null;
  sortOrder: number;
  createdAt: string;
};

export type AdminStore = {
  version: number;
  products: AdminProduct[];
  orders: AdminOrder[];
  lookbook: AdminLookbookSlide[];
  /** Fiches seed retirées du stock admin / catalogue live (ids catalogue). */
  removedCatalogIds?: string[];
};

export const STORE_VERSION = 10;

export function isPantWaistSize(value: string): value is PantWaistSize {
  return (PANT_WAIST_PRESET_SIZES as readonly string[]).includes(value);
}

export function isProductSize(value: string): value is ProductSize {
  const normalized = value.trim();
  if ((PRODUCT_SIZES as readonly string[]).includes(normalized)) return true;
  return isValidPantWaistSize(normalized);
}

export { normalizePantWaistSize, isValidPantWaistSize, PANT_WAIST_PRESET_SIZES, PANT_WAIST_MIN, PANT_WAIST_MAX } from "@/lib/admin/pant-waist";

export function isProductCategory(value: string): value is ProductCategory {
  return normalizeProductCategory(value) === value && (PRODUCT_CATEGORIES as readonly string[]).includes(value);
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
  if (product.publishStatus === "draft") return null;
  return {
    id,
    sku: product.sku,
    name: product.name,
    variant: product.variant,
    description: product.description,
    ...(product.fabrication.trim() ? { fabrication: product.fabrication.trim() } : {}),
    ...(product.limitedEdition.trim() ? { limitedEdition: product.limitedEdition.trim() } : {}),
    ...(product.materials.trim() ? { materials: product.materials.trim() } : {}),
    ...(product.sizeGuide.trim() ? { sizeGuide: product.sizeGuide.trim() } : {}),
    category: product.category,
    price: product.price,
    image: product.imageUrl,
    sizes: product.sizes,
    stock: product.stock,
    ...(product.colorDeclinations.length > 0
      ? { colorDeclinations: [...product.colorDeclinations] }
      : {}),
    isPinned: product.isPinned,
    displayOrder: product.displayOrder,
    adminCreatedAt: product.createdAt,
  };
}
