import type { AdminProductPreviewModel } from "@/components/organisms/admin/admin-product-preview";
import type { ShopProduct } from "@/lib/catalog";
import { isDraftPlaceholderImage } from "@/lib/admin/types";
import { resolveShopCategory } from "@/lib/shop-catalog";

const PREVIEW_FALLBACK_ID = 900_001;

/** Produit boutique pour aperçu CRM — données formulaire uniquement, sans lecture/écriture API. */
export function previewModelToShopProduct(
  model: AdminProductPreviewModel,
  productId?: string | null,
): ShopProduct {
  const parsedId = productId ? Number(productId) : NaN;
  const id = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : PREVIEW_FALLBACK_ID;

  const recto = model.imageSrc.trim();
  const image =
    recto.length > 0 && !isDraftPlaceholderImage(recto) ? recto : "/dingry-draft-product.svg";
  const verso = model.imageBackSrc.trim();
  const category = resolveShopCategory(id, model.category) ?? model.category;

  return {
    id,
    sku: "APERÇU",
    name: model.name.trim() || "Nouveau produit",
    variant: model.variant.trim() || "—",
    description: model.description.trim(),
    category,
    price: Number(model.price) || 0,
    image,
    ...(verso.length > 0 && !isDraftPlaceholderImage(verso) ? { imageBack: verso } : {}),
    ...(model.sizes.length > 0 ? { sizes: [...model.sizes] } : {}),
    stock: Math.max(0, Math.floor(model.stock)),
    ...(model.printPlacement ? { printPlacement: model.printPlacement } : {}),
  };
}
