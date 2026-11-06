import {
  normalizePrintPlacement,
  type CatalogProduct,
  type ProductPrintPlacement,
} from "@/lib/admin/types";
import { isDraftPlaceholderImage, isProductSize } from "@/lib/admin/types";
import {
  isVersoCatalogId,
  resolveRectoCatalogId,
  versoSkuFromRecto,
} from "@/lib/catalog-verso-recto";
import { CATALOG_CANONICAL_IMAGE_BY_ID } from "@/lib/dingry-product-media";
import { normalizeAdminCategory, resolveShopCategory, type ShopCategory } from "@/lib/shop-catalog";
export type ShopProduct = {
  id: number;
  name: string;
  variant: string;
  price: number;
  image: string;
  /** Dos (CRM) — prioritaire sur les paires figées hoodies/sweats si renseigné. */
  imageBack?: string;
  description: string;
  fabrication?: string;
  limitedEdition?: string;
  materials?: string;
  sizeGuide?: string;
  printPlacement?: ProductPrintPlacement;
  category: ShopCategory | string;
  sku?: string;
  sizes?: string[];
  colorDeclinations?: string[];
  /** 0 = rupture (API `inStock: false`), absent = fallback statique en stock. */
  stock?: number;
  isPinned?: boolean;
  displayOrder?: number;
  /** ISO — tri antichrono boutique si pas d’ordre manuel. */
  adminCreatedAt?: string;
};

export function isShopProductInStock(product: ShopProduct): boolean {
  if (product.stock === undefined) return true;
  return product.stock > 0;
}

function storyFieldsFromCatalog(product: CatalogProduct): Pick<
  ShopProduct,
  "fabrication" | "limitedEdition" | "materials" | "sizeGuide" | "printPlacement"
> {
  return {
    ...(product.fabrication?.trim() ? { fabrication: product.fabrication.trim() } : {}),
    ...(product.limitedEdition?.trim() ? { limitedEdition: product.limitedEdition.trim() } : {}),
    ...(product.materials?.trim() ? { materials: product.materials.trim() } : {}),
    ...(product.sizeGuide?.trim() ? { sizeGuide: product.sizeGuide.trim() } : {}),
    ...(product.printPlacement ? { printPlacement: product.printPlacement } : {}),
  };
}

export function catalogToShopProduct(product: CatalogProduct): ShopProduct {
  return {
    id: product.id,
    name: product.name,
    variant: product.variant,
    price: product.price,
    image: product.image,
    ...(product.imageBack?.trim() ? { imageBack: product.imageBack.trim() } : {}),
    description: product.description,
    ...storyFieldsFromCatalog(product),
    category: resolveShopCategory(product.id, product.category),
    sku: product.sku,
    sizes: product.sizes,
    stock: product.stock,
    ...(product.colorDeclinations?.length ? { colorDeclinations: [...product.colorDeclinations] } : {}),
    ...(product.isPinned ? { isPinned: true } : {}),
    ...(product.displayOrder !== undefined && product.displayOrder > 0
      ? { displayOrder: product.displayOrder }
      : {}),
    ...(product.adminCreatedAt ? { adminCreatedAt: product.adminCreatedAt } : {}),
  };
}

function resolveLiveOverlay(
  productId: number,
  liveById: Map<number, CatalogProduct>,
): { overlay: CatalogProduct; inheritedFromRecto: boolean } | null {
  const direct = liveById.get(productId);
  if (direct) return { overlay: direct, inheritedFromRecto: false };

  if (!isVersoCatalogId(productId)) return null;
  const rectoId = resolveRectoCatalogId(productId);
  if (rectoId === productId) return null;
  const fromRecto = liveById.get(rectoId);
  if (!fromRecto) return null;
  return { overlay: fromRecto, inheritedFromRecto: true };
}

function mergeStoryOverlay(
  base: ShopProduct,
  overlay: CatalogProduct,
): Pick<ShopProduct, "fabrication" | "limitedEdition" | "materials" | "sizeGuide" | "printPlacement"> {
  const pick = (key: "fabrication" | "limitedEdition" | "materials" | "sizeGuide") => {
    const fromOverlay = overlay[key]?.trim();
    if (fromOverlay) return fromOverlay;
    return base[key]?.trim() || undefined;
  };
  const printPlacement = overlay.printPlacement || base.printPlacement;
  return {
    ...(pick("fabrication") ? { fabrication: pick("fabrication") } : {}),
    ...(pick("limitedEdition") ? { limitedEdition: pick("limitedEdition") } : {}),
    ...(pick("materials") ? { materials: pick("materials") } : {}),
    ...(pick("sizeGuide") ? { sizeGuide: pick("sizeGuide") } : {}),
    ...(printPlacement ? { printPlacement } : {}),
  };
}

function applyCatalogOverlay(
  product: ShopProduct,
  overlay: CatalogProduct,
  inheritedFromRecto: boolean,
): ShopProduct {
  const liveImage = overlay.image.trim();
  const sku =
    inheritedFromRecto && product.id !== overlay.id
      ? versoSkuFromRecto(overlay.sku)
      : overlay.sku;
  const overlayBack = overlay.imageBack?.trim();
  return {
    ...product,
    name: overlay.name,
    variant: inheritedFromRecto
      ? product.variant || overlay.variant
      : overlay.variant || product.variant,
    price: overlay.price,
    image: inheritedFromRecto
      ? product.image
      : liveImage && !isDraftPlaceholderImage(liveImage)
        ? liveImage
        : (CATALOG_CANONICAL_IMAGE_BY_ID[product.id] ?? product.image),
    ...(inheritedFromRecto
      ? {}
      : overlayBack && !isDraftPlaceholderImage(overlayBack)
        ? { imageBack: overlayBack }
        : { imageBack: undefined }),
    description: overlay.description?.trim() || product.description,
    ...mergeStoryOverlay(product, overlay),
    category: resolveShopCategory(product.id, overlay.category || product.category),
    sku,
    sizes: overlay.sizes,
    stock: overlay.stock,
    ...(overlay.colorDeclinations?.length
      ? { colorDeclinations: [...overlay.colorDeclinations] }
      : {}),
    ...(overlay.isPinned ? { isPinned: true } : product.isPinned ? { isPinned: true } : {}),
    ...(overlay.displayOrder !== undefined
      ? { displayOrder: overlay.displayOrder }
      : product.displayOrder !== undefined
        ? { displayOrder: product.displayOrder }
        : {}),
    ...(overlay.adminCreatedAt
      ? { adminCreatedAt: overlay.adminCreatedAt }
      : product.adminCreatedAt
        ? { adminCreatedAt: product.adminCreatedAt }
        : {}),
  };
}

function normalizeRemovedCatalogIds(ids: readonly (string | number)[] | undefined): Set<number> {
  const removed = new Set<number>();
  if (!ids?.length) return removed;
  for (const raw of ids) {
    const id = Number(String(raw).trim());
    if (Number.isInteger(id) && id > 0) removed.add(id);
  }
  return removed;
}

/** Id masqué boutique : tombstone CRM ou verso dont le recto est retiré. */
export function isShopCatalogIdHidden(
  catalogId: number,
  removed: ReadonlySet<number>,
): boolean {
  if (removed.has(catalogId)) return true;
  const rectoId = resolveRectoCatalogId(catalogId);
  return rectoId !== catalogId && removed.has(rectoId);
}

export function overlayShopCatalog(
  fallback: ShopProduct[],
  live: CatalogProduct[],
  removedCatalogIds: readonly (string | number)[] = [],
): ShopProduct[] {
  const removed = normalizeRemovedCatalogIds(removedCatalogIds);
  const liveById = new Map(live.map((product) => [product.id, product]));

  const merged = fallback.map((product) => {
    const resolved = resolveLiveOverlay(product.id, liveById);
    const canonicalImage = CATALOG_CANONICAL_IMAGE_BY_ID[product.id];
    if (!resolved) {
      const image = canonicalImage ?? product.image;
      const category = resolveShopCategory(product.id, product.category);
      const next =
        image !== product.image || category !== product.category
          ? { ...product, image, category }
          : product;
      return next;
    }
    return applyCatalogOverlay(product, resolved.overlay, resolved.inheritedFromRecto);
  });

  const extras = live
    .filter((product) => !fallback.some((item) => item.id === product.id))
    .map(catalogToShopProduct)
    .map((product) => {
      const liveImage = product.image.trim();
      if (liveImage && !isDraftPlaceholderImage(liveImage)) return product;
      const canonicalImage = CATALOG_CANONICAL_IMAGE_BY_ID[product.id];
      return canonicalImage ? { ...product, image: canonicalImage } : product;
    });

  return [...merged, ...extras].filter((product) => !isShopCatalogIdHidden(product.id, removed));
}

function sizesFromApiRecord(record: Record<string, unknown>): CatalogProduct["sizes"] {
  if (!Array.isArray(record.sizes)) return ["S", "M", "L", "XL"];
  const sizes = record.sizes
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0 && isProductSize(item));
  return sizes.length > 0 ? (Array.from(new Set(sizes)) as CatalogProduct["sizes"]) : ["S", "M", "L", "XL"];
}

export function shopProductFromUnknown(value: unknown): CatalogProduct | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = Number(record.id);
  const price = Number(record.price);
  if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(price) || price <= 0) return null;
  if (typeof record.name !== "string" || typeof record.image !== "string") return null;
  const inStockFromApi = typeof record.inStock === "boolean" ? record.inStock : undefined;
  const stockFromApi: number | undefined =
    inStockFromApi !== undefined
      ? inStockFromApi
        ? 1
        : 0
      : record.stock !== undefined && Number.isFinite(Number(record.stock))
        ? Math.max(0, Number(record.stock))
        : undefined;
  const printPlacement = normalizePrintPlacement(record.printPlacement);
  return {
    id,
    sku: typeof record.sku === "string" ? record.sku : `DINGRY-${id}`,
    name: record.name,
    variant: typeof record.variant === "string" ? record.variant : "",
    ...(typeof record.imageBack === "string" && record.imageBack.trim()
      ? { imageBack: record.imageBack.trim() }
      : {}),
    description: typeof record.description === "string" ? record.description : "",
    fabrication: typeof record.fabrication === "string" ? record.fabrication : undefined,
    limitedEdition: typeof record.limitedEdition === "string" ? record.limitedEdition : undefined,
    materials: typeof record.materials === "string" ? record.materials : undefined,
    sizeGuide: typeof record.sizeGuide === "string" ? record.sizeGuide : undefined,
    ...(printPlacement ? { printPlacement } : {}),
    category: normalizeAdminCategory(typeof record.category === "string" ? record.category : "Tee"),
    price,
    image: record.image,
    sizes: sizesFromApiRecord(record),
    stock: stockFromApi,
  };
}
