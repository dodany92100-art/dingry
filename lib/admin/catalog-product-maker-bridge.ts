import type { AdminImageUploadResponse } from "@/lib/client/admin-upload-image";
import type { AdminProduct } from "@/lib/admin/types";
import { isDraftPlaceholderImage } from "@/lib/admin/types";
import { sortAdminProductsForDisplay } from "@/lib/admin/product-display-order";
import {
  normalizeCatalogMakerLabel,
  roundPriceHtFromTtc,
  type CatalogMakerTemplate,
} from "@/lib/validations/catalog-maker-template";

export const CATALOG_PRODUCT_MAKER_PREFIX = "catalog-product:";

export function isCatalogProductMakerTemplateId(id: string): boolean {
  return id.startsWith(CATALOG_PRODUCT_MAKER_PREFIX);
}

/** Modèles dérivés des fiches CRM déjà enregistrées (préremplissage nouveau produit). */
export function catalogProductMakerTemplates(
  products: readonly AdminProduct[],
  opts?: { excludeProductId?: string | null },
): CatalogMakerTemplate[] {
  const exclude = opts?.excludeProductId?.trim() ?? "";
  return sortAdminProductsForDisplay(products)
    .filter((product) => !exclude || product.id !== exclude)
    .map((product) => adminProductToMakerTemplate(product));
}

function adminProductToMakerTemplate(product: AdminProduct): CatalogMakerTemplate {
  const gram = product.sizeGuide.trim();
  const now = product.createdAt || new Date().toISOString();
  return {
    id: `${CATALOG_PRODUCT_MAKER_PREFIX}${product.id}`,
    label: normalizeCatalogMakerLabel(product.name),
    category: product.category,
    priceTtc: product.price,
    priceHt: roundPriceHtFromTtc(product.price),
    sizes: [...product.sizes],
    sizeGuide: gram,
    createdAt: now,
    updatedAt: now,
  };
}

export function colorDeclinationsFromAdminProduct(product: AdminProduct): string[] {
  const fromField = product.colorDeclinations.map((c) => c.trim()).filter(Boolean);
  if (fromField.length > 0) return fromField;
  const fromOptions = (product.options ?? [])
    .map((opt) => opt.label.trim() || opt.color.trim())
    .filter(Boolean);
  if (fromOptions.length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of fromOptions) {
    const key = label.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

/** Réutilise les URLs R2/CRM pour pré-enregistrer recto / verso sur une nouvelle fiche. */
export function adminProductPreuploadedImage(
  product: AdminProduct,
  face: "recto" | "verso",
): AdminImageUploadResponse | null {
  if (face === "recto") {
    const url = (product.blobUrl ?? product.imageUrl).trim();
    if (!url || isDraftPlaceholderImage(url)) return null;
    return { url, pathname: product.blobPathname };
  }
  const url = (product.imageBackBlobUrl ?? product.imageBackUrl).trim();
  if (!url || isDraftPlaceholderImage(url)) return null;
  return { url, pathname: product.imageBackBlobPathname };
}

export function catalogProductMakerOptionLabel(
  product: AdminProduct,
  template: CatalogMakerTemplate,
): string {
  const gram = (template.sizeGuide ?? "").trim();
  const status =
    product.publishStatus === "live"
      ? "en ligne"
      : product.publishStatus === "draft"
        ? "brouillon"
        : product.publishStatus;
  const variant = product.variant.trim();
  const base = variant
    ? `${product.name} · ${variant} · ${product.price} € · ${product.category}`
    : `${product.name} · ${product.price} € · ${product.category}`;
  return gram ? `${base} · ${gram} · ${status}` : `${base} · ${status}`;
}