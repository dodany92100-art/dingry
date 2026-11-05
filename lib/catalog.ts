import {
  type CatalogProduct,
} from "@/lib/admin/types";
import {
  isVersoCatalogId,
  resolveRectoCatalogId,
  versoSkuFromRecto,
} from "@/lib/catalog-verso-recto";
import { CATALOG_CANONICAL_IMAGE_BY_ID } from "@/lib/dingry-product-media";
import { normalizeAdminCategory, resolveShopCategory, type ShopCategory } from "@/lib/shop-catalog";
import { withStorefrontPrice } from "@/lib/dingry-storefront-prices";

export type ShopProduct = {
  id: number;
  name: string;
  variant: string;
  price: number;
  image: string;
  description: string;
  category: ShopCategory | string;
  sku?: string;
  sizes?: string[];
  /** 0 = rupture (API `inStock: false`), absent = fallback statique en stock. */
  stock?: number;
};

export function isShopProductInStock(product: ShopProduct): boolean {
  if (product.stock === undefined) return true;
  return product.stock > 0;
}

export function catalogToShopProduct(product: CatalogProduct): ShopProduct {
  return {
    id: product.id,
    name: product.name,
    variant: product.variant,
    price: product.price,
    image: product.image,
    description: product.description,
    category: resolveShopCategory(product.id, product.category),
    sku: product.sku,
    sizes: product.sizes,
    stock: product.stock,
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

function applyCatalogOverlay(
  product: ShopProduct,
  overlay: CatalogProduct,
  inheritedFromRecto: boolean,
): ShopProduct {
  const canonicalImage = CATALOG_CANONICAL_IMAGE_BY_ID[product.id];
  const sku =
    inheritedFromRecto && product.id !== overlay.id
      ? versoSkuFromRecto(overlay.sku)
      : overlay.sku;
  return {
    ...product,
    name: overlay.name,
    variant: inheritedFromRecto
      ? product.variant || overlay.variant
      : overlay.variant || product.variant,
    price: overlay.price,
    image: inheritedFromRecto
      ? (canonicalImage ?? product.image)
      : (canonicalImage ?? overlay.image),
    description: overlay.description || product.description,
    category: resolveShopCategory(product.id, overlay.category || product.category),
    sku,
    sizes: overlay.sizes,
    stock: overlay.stock,
  };
}

export function overlayShopCatalog(
  fallback: ShopProduct[],
  live: CatalogProduct[],
): ShopProduct[] {
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
      return withStorefrontPrice(next);
    }
    return applyCatalogOverlay(product, resolved.overlay, resolved.inheritedFromRecto);
  });

  const extras = live
    .filter((product) => !fallback.some((item) => item.id === product.id))
    .map(catalogToShopProduct)
    .map((product) => {
      const canonicalImage = CATALOG_CANONICAL_IMAGE_BY_ID[product.id];
      const withImage = canonicalImage ? { ...product, image: canonicalImage } : product;
      return withImage;
    });

  return [...merged, ...extras];
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
  return {
    id,
    sku: typeof record.sku === "string" ? record.sku : `DINGRY-${id}`,
    name: record.name,
    variant: typeof record.variant === "string" ? record.variant : "",
    description: typeof record.description === "string" ? record.description : "",
    category: normalizeAdminCategory(typeof record.category === "string" ? record.category : "Tee"),
    price,
    image: record.image,
    sizes: Array.isArray(record.sizes)
      ? record.sizes.filter((item): item is CatalogProduct["sizes"][number] =>
          item === "S" || item === "M" || item === "L" || item === "XL" || item === "TU",
        )
      : ["S", "M", "L", "XL"],
    stock: stockFromApi,
  };
}
