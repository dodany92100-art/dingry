import { productSlugForCatalogId } from "@/lib/dingry-product-copy";
import type { ShopProduct } from "@/lib/catalog";

export type ProductModalData = {
  id: number;
  slug: string;
  title: string;
  price: number;
  coverUrl: string;
};

export type ProductModalProps = {
  data: ProductModalData | null;
  onClose: () => void;
};

export function productModalDataFromShop(product: ShopProduct): ProductModalData | null {
  const id = product.id;
  const slug = (productSlugForCatalogId(id) ?? `produit-${id}`).trim();
  const title = product.name.trim();
  const coverUrl = product.image.trim();
  const price = product.price;
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!slug || !title || !coverUrl) return null;
  if (typeof price !== "number" || !(price >= 0)) return null;
  return { id, slug, title, price, coverUrl };
}
