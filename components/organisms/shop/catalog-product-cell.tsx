"use client";

import { memo, useCallback } from "react";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import { ProductCard } from "@/components/molecules/product-card";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { catalogRectoId, storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { CATALOG_CANONICAL_IMAGE_BY_ID } from "@/lib/dingry-product-media";
import { PRODUCTS } from "@/lib/shop-data";

function catalogGridImageFallback(productId: number): string | undefined {
  const canonical = CATALOG_CANONICAL_IMAGE_BY_ID[productId]?.trim();
  if (canonical) return canonical;
  return PRODUCTS.find((item) => item.id === productId)?.image.trim() || undefined;
}
import { prefetchShopProductMedia } from "@/lib/shop-prefetch";

export const CatalogProductCell = memo(function CatalogProductCell({
  product,
  catalog,
  globalIndex,
  wishlistActive,
  onOpenProduct,
  onToggleWishlist,
  showAdminIdBadge = false,
}: {
  product: ShopProduct;
  catalog: readonly ShopProduct[];
  globalIndex: number;
  wishlistActive: boolean;
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  onToggleWishlist: (rectoId: number) => void;
  showAdminIdBadge?: boolean;
}) {
  const rectoId = catalogRectoId(product.id);
  const onClick = useCallback(() => onOpenProduct(product, "recto"), [onOpenProduct, product]);
  const onPrefetch = useCallback(
    () => prefetchShopProductMedia(product.image, product.imageBack),
    [product.image, product.imageBack],
  );
  const onWishlist = useCallback(() => onToggleWishlist(rectoId), [onToggleWishlist, rectoId]);
  return (
    <ProductCard
      className="h-full"
      productId={product.id}
      showAdminIdBadge={showAdminIdBadge}
      name={storefrontProductTitle(product, catalog)}
      variant={storefrontProductSubtitle(product, catalog)}
      image={product.image}
      imageFallback={catalogGridImageFallback(product.id)}
      price={product.price}
      priority={globalIndex === 0}
      soldOut={!isShopProductInStock(product)}
      onPrefetch={onPrefetch}
      onClick={onClick}
      wishlistActive={wishlistActive}
      onWishlistToggle={onWishlist}
    />
  );
});
