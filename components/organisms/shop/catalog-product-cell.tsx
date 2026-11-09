"use client";

import { memo, useCallback } from "react";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import { ProductCard } from "@/components/molecules/product-card";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { catalogRectoId, storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { prefetchShopProductMedia } from "@/lib/shop-prefetch";

export const CatalogProductCell = memo(function CatalogProductCell({
  product,
  catalog,
  globalIndex,
  wishlistActive,
  onOpenProduct,
  onToggleWishlist,
}: {
  product: ShopProduct;
  catalog: readonly ShopProduct[];
  globalIndex: number;
  wishlistActive: boolean;
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  onToggleWishlist: (rectoId: number) => void;
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
      productId={rectoId}
      name={storefrontProductTitle(product, catalog)}
      variant={storefrontProductSubtitle(product, catalog)}
      image={product.image}
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
