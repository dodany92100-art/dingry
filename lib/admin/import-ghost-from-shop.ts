import type { AdminProduct } from "@/lib/admin/types";
import { normalizePrintPlacement, normalizeProductCategory } from "@/lib/admin/types";
import { isVersoCatalogId, resolveRectoCatalogId } from "@/lib/catalog-verso-recto";
import type { ShopProduct } from "@/lib/catalog";
import { SEEDED_PRODUCTS } from "@/lib/admin/seed";
import { PRODUCTS, DEFAULT_SHOP_PRODUCT_STOCK } from "@/lib/shop-data";

const SEED_BY_ID = new Map(SEEDED_PRODUCTS.map((row) => [row.id, row]));
const PRODUCTS_BY_ID = new Map(PRODUCTS.map((row) => [row.id, row]));

function backImageForRecto(rectoId: number): string {
  const recto = PRODUCTS_BY_ID.get(rectoId);
  if (recto?.imageBack?.trim()) return recto.imageBack.trim();
  for (const candidate of PRODUCTS) {
    if (!isVersoCatalogId(candidate.id)) continue;
    if (resolveRectoCatalogId(candidate.id) !== rectoId) continue;
    if (candidate.image.trim()) return candidate.image.trim();
  }
  return "";
}

export function shopProductToImportAdminProduct(shop: ShopProduct): AdminProduct {
  const id = String(shop.id);
  const seed = SEED_BY_ID.get(id);
  const category = normalizeProductCategory(
    typeof shop.category === "string" ? shop.category : (seed?.category ?? "T-shirts"),
  );
  const stock = Math.max(
    0,
    Math.floor(shop.stock ?? seed?.stock ?? DEFAULT_SHOP_PRODUCT_STOCK),
  );
  const sizes = shop.sizes?.length
    ? [...shop.sizes]
    : seed?.sizes?.length
      ? [...seed.sizes]
      : ["S", "M", "L", "XL"];

  return {
    id,
    sku: seed?.sku ?? shop.sku ?? `DINGRY-${id}`,
    name: shop.name,
    variant: shop.variant,
    description: shop.description || seed?.description || "",
    fabrication: shop.fabrication ?? seed?.fabrication ?? "",
    limitedEdition: shop.limitedEdition ?? seed?.limitedEdition ?? "",
    materials: shop.materials ?? seed?.materials ?? "",
    sizeGuide: shop.sizeGuide ?? seed?.sizeGuide ?? "",
    printPlacement: normalizePrintPlacement(shop.printPlacement ?? seed?.printPlacement ?? ""),
    category,
    price: shop.price,
    sizes,
    stock,
    publishStatus: "live",
    colorDeclinations: shop.colorDeclinations?.length
      ? [...shop.colorDeclinations]
      : seed?.colorDeclinations?.length
        ? [...seed.colorDeclinations]
        : [],
    imageUrl: shop.image.trim() || seed?.imageUrl.trim() || "",
    blobUrl: null,
    blobPathname: null,
    imageBackUrl: backImageForRecto(shop.id),
    imageBackBlobUrl: null,
    imageBackBlobPathname: null,
    createdAt: seed?.createdAt ?? shop.adminCreatedAt ?? new Date().toISOString(),
    isPinned: shop.isPinned ?? seed?.isPinned ?? false,
    displayOrder: shop.displayOrder ?? seed?.displayOrder ?? 0,
  };
}

export function resolveImportableShopProduct(productId: number): ShopProduct | null {
  if (isVersoCatalogId(productId)) return null;
  return PRODUCTS_BY_ID.get(productId) ?? null;
}
