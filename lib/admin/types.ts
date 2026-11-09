import type { ProductOption } from "@/lib/catalog/product-options";
import { PANT_WAIST_PRESET_SIZES, isValidPantWaistSize, normalizePantWaistSize } from "@/lib/admin/pant-waist";
/** Grille admin + Smart collage (2XL–5XL, XXS). Ordre d'affichage modale produit. */
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
import { normalizeCatalogCategory, type CatalogCategory } from "@/lib/catalog-category";

const LEGACY_PRODUCT_CATEGORY: Record<string, ProductCategory> = {
  Tee: "T-shirts",
  Hoodie: "Hoodies",
  "Hoodie zippé": "Hoodies zippés",
  Sweats: "Crewnecks",
  Jersey: "Jerseys",
  Pant: "Pants",
  Pantalon: "Pants",
  Pantalons: "Pants",
  "Crop Top": "Crop tops",
  "Crop top": "Crop tops",
};

const CATALOG_SLUG_TO_OFFICIAL: Record<CatalogCategory, ProductCategory> = {
  hoodies: "Hoodies",
  "hoodie-zip": "Hoodies zippés",
  sweats: "Crewnecks",
  "t-shirts": "T-shirts",
  jersey: "Jerseys",
  pants: "Pants",
  "crop-top": "Crop tops",
  caps: "Caps",
};

export function productCategoryFromCatalogSlug(slug: CatalogCategory): ProductCategory {
  return CATALOG_SLUG_TO_OFFICIAL[slug];
}

/** Normalise anciennes fiches CRM + valeurs boutique. */
export function normalizeProductCategory(value: string): ProductCategory {
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(value)) return value as ProductCategory;
  const legacy = LEGACY_PRODUCT_CATEGORY[value];
  if (legacy) return legacy;
  const slug = normalizeCatalogCategory(value);
  if (slug) return CATALOG_SLUG_TO_OFFICIAL[slug];
  return "T-shirts";
}

/** Tailles proposées dans le formulaire admin par catégorie. */
export const ADMIN_CATEGORY_SIZES: Record<ProductCategory, readonly ProductSize[]> = {
  Hoodies: PRODUCT_SIZES,
  "Hoodies zippés": PRODUCT_SIZES,
  Crewnecks: PRODUCT_SIZES,
  "T-shirts": PRODUCT_SIZES,
  Jerseys: PRODUCT_SIZES,
  Pants: PANT_WAIST_PRESET_SIZES,
  "Crop tops": ["S", "M", "L", "XL", "2XL"],
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

/** Zone d’impression / finition (CRM → fiche boutique). */
export type ProductPrintPlacement = "" | "RECTO_VERSO" | "RECTO_ONLY" | "VERSO_ONLY";

export const PRODUCT_PRINT_PLACEMENT_OPTIONS: readonly ProductPrintPlacement[] = [
  "",
  "RECTO_VERSO",
  "RECTO_ONLY",
  "VERSO_ONLY",
];

export const PRODUCT_PRINT_PLACEMENT_LABELS: Record<ProductPrintPlacement, string> = {
  "": "Non renseigné",
  RECTO_VERSO: "RECTO / VERSO",
  RECTO_ONLY: "RECTO SEUL",
  VERSO_ONLY: "VERSO SEUL",
};

export function printPlacementDisplayLabel(value: ProductPrintPlacement): string {
  if (!value) return "";
  return PRODUCT_PRINT_PLACEMENT_LABELS[value];
}

/** Image locale tant qu’aucune photo n’est uploadée (brouillon admin). */
export const DRAFT_PRODUCT_PLACEHOLDER_IMAGE = "/dingry-draft-product.svg";

export function normalizePublishStatus(value: unknown): ProductPublishStatus {
  return value === "draft" ? "draft" : "live";
}

export function normalizePrintPlacement(value: unknown): ProductPrintPlacement {
  const v = String(value ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  if (v === "RECTO_VERSO" || v === "RECTO/VERSO") return "RECTO_VERSO";
  if (v === "RECTO_ONLY" || v === "RECTO_SEUL" || v === "RECTOSEUL") return "RECTO_ONLY";
  if (v === "VERSO_ONLY" || v === "VERSO_SEUL" || v === "VERSOSEUL") return "VERSO_ONLY";
  return "";
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
  /** Impression recto/verso (vide = non affiché boutique). */
  printPlacement: ProductPrintPlacement;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  stock: number;
  publishStatus: ProductPublishStatus;
  /** Coloris proposés dans le modal boutique (déclinaisons). Vide = variante seule. */
  colorDeclinations: string[];
  /** Déclinaisons persistées (`product_options`) — chargées depuis Supabase. */
  options?: ProductOption[];
  imageUrl: string;
  blobUrl: string | null;
  blobPathname: string | null;
  /** Photo dos (flip catalogue). Vide si absent. */
  imageBackUrl: string;
  imageBackBlobUrl: string | null;
  imageBackBlobPathname: string | null;
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
  printPlacement?: ProductPrintPlacement;
  category: ProductCategory;
  price: number;
  image: string;
  /** Photo dos pour flip (produits CRM avec recto + verso sur une même fiche). */
  imageBack?: string;
  sizes: ProductSize[];
  /** Coloris modal boutique (recto CRM associés par famille + nom). */
  colorDeclinations?: string[];
  options?: ProductOption[];
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

/** Bannière catalogue · tee personnalisé (singleton CRM). */
export type AdminCatalogPersoBanner = {
  enabled: boolean;
  imageUrl: string;
  blobUrl: string | null;
  blobPathname: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  updatedAt: string;
};

export type ShopCatalogPersoBanner = Pick<
  AdminCatalogPersoBanner,
  "enabled" | "imageUrl" | "eyebrow" | "title" | "subtitle" | "ctaLabel"
>;

export type { PriceFamily } from "@/lib/validations/price-family";

export type AdminStore = {
  version: number;
  products: AdminProduct[];
  orders: AdminOrder[];
  lookbook: AdminLookbookSlide[];
  catalogPersoBanner?: AdminCatalogPersoBanner;
  /** @deprecated — remplacé par `makerTemplates`. */
  priceFamilies?: import("@/lib/validations/price-family").PriceFamily[];
  /** Bibliothèque modèles maker (HOODIE, TEE-SHIRT…). */
  makerTemplates?: import("@/lib/validations/catalog-maker-template").CatalogMakerTemplate[];
  /** Fiches seed retirées du stock admin / catalogue live (ids catalogue). */
  removedCatalogIds?: string[];
  /** Slides lookbook supprimées — ne pas réinjecter depuis le seed au rechargement. */
  removedLookbookSlideIds?: string[];
};

export const STORE_VERSION = 16;

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
  return FULFILLMENT_STATUSES[(index + 1) % FULFILLMENT_STATUSES.length] ?? "En attente";
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
    ...(product.printPlacement ? { printPlacement: product.printPlacement } : {}),
    category: product.category,
    price: product.price,
    image: product.imageUrl,
    ...(product.imageBackUrl.trim() ? { imageBack: product.imageBackUrl.trim() } : {}),
    sizes: product.sizes,
    stock: product.stock,
    ...(product.colorDeclinations.length > 0
      ? { colorDeclinations: [...product.colorDeclinations] }
      : {}),
    ...(product.options && product.options.length > 0 ? { options: [...product.options] } : {}),
    isPinned: product.isPinned,
    displayOrder: product.displayOrder,
    adminCreatedAt: product.createdAt,
  };
}
