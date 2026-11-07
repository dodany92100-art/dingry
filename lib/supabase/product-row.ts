import type { AdminProduct, ProductPrintPlacement, ProductPublishStatus } from "@/lib/admin/types";
import { normalizePrintPlacement, normalizeProductCategory, normalizePublishStatus } from "@/lib/admin/types";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  variant: string;
  description: string;
  fabrication: string;
  limited_edition: string;
  materials: string;
  size_guide: string;
  print_placement: string;
  category: string;
  price: number;
  sizes: string[];
  stock: number;
  publish_status: string;
  color_declinations: string[];
  image_url: string;
  blob_url: string | null;
  blob_pathname: string | null;
  image_back_url: string;
  image_back_blob_url: string | null;
  image_back_blob_pathname: string | null;
  created_at: string;
  is_pinned: boolean;
  display_order: number;
};

export function adminProductToRow(product: AdminProduct): ProductRow {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    variant: product.variant,
    description: product.description,
    fabrication: product.fabrication,
    limited_edition: product.limitedEdition,
    materials: product.materials,
    size_guide: product.sizeGuide,
    print_placement: product.printPlacement,
    category: product.category,
    price: product.price,
    sizes: [...product.sizes],
    stock: product.stock,
    publish_status: product.publishStatus,
    color_declinations: [...product.colorDeclinations],
    image_url: product.imageUrl,
    blob_url: product.blobUrl,
    blob_pathname: product.blobPathname,
    image_back_url: product.imageBackUrl,
    image_back_blob_url: product.imageBackBlobUrl,
    image_back_blob_pathname: product.imageBackBlobPathname,
    created_at: product.createdAt,
    is_pinned: product.isPinned,
    display_order: product.displayOrder,
  };
}

export function rowToAdminProduct(row: ProductRow): AdminProduct {
  return {
    id: String(row.id),
    sku: String(row.sku ?? ""),
    name: String(row.name ?? ""),
    variant: String(row.variant ?? ""),
    description: String(row.description ?? ""),
    fabrication: String(row.fabrication ?? ""),
    limitedEdition: String(row.limited_edition ?? ""),
    materials: String(row.materials ?? ""),
    sizeGuide: String(row.size_guide ?? ""),
    printPlacement: normalizePrintPlacement(row.print_placement) as ProductPrintPlacement,
    category: normalizeProductCategory(String(row.category ?? "T-shirts")),
    price: Number(row.price) || 0,
    sizes: Array.isArray(row.sizes) ? row.sizes.map(String) : [],
    stock: Math.max(0, Math.floor(Number(row.stock) || 0)),
    publishStatus: normalizePublishStatus(row.publish_status) as ProductPublishStatus,
    colorDeclinations: Array.isArray(row.color_declinations) ? row.color_declinations.map(String) : [],
    imageUrl: String(row.image_url ?? ""),
    blobUrl: row.blob_url ?? null,
    blobPathname: row.blob_pathname ?? null,
    imageBackUrl: String(row.image_back_url ?? ""),
    imageBackBlobUrl: row.image_back_blob_url ?? null,
    imageBackBlobPathname: row.image_back_blob_pathname ?? null,
    createdAt: row.created_at,
    isPinned: Boolean(row.is_pinned),
    displayOrder: Number(row.display_order) || 0,
  };
}
