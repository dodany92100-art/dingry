"use client";

import { memo, useCallback, useState, type MouseEvent } from "react";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import { ProductCard } from "@/components/molecules/product-card";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { catalogRectoId, storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { modalSizesFor } from "@/lib/shop-view";
import { prefetchShopProductMedia } from "@/lib/shop-prefetch";

type WishlistGridItemProps = {
  product: ShopProduct;
  catalog: readonly ShopProduct[];
  wishlistActive: boolean;
  purchaseDisabled?: boolean;
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  onToggleWishlist: (rectoId: number) => void;
  onAddToCart: (product: ShopProduct, size: string, from: HTMLElement) => void;
};

function WishlistGridItemInner({
  product,
  catalog,
  wishlistActive,
  purchaseDisabled = false,
  onOpenProduct,
  onToggleWishlist,
  onAddToCart,
}: WishlistGridItemProps) {
  const rectoId = catalogRectoId(product.id);
  const sizes = modalSizesFor(product);
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);
  const outOfStock = !isShopProductInStock(product);
  const cannotPurchase = purchaseDisabled || outOfStock;

  const openRecto = useCallback(() => onOpenProduct(product, "recto"), [onOpenProduct, product]);
  const onPrefetch = useCallback(
    () => prefetchShopProductMedia(product.image, product.imageBack),
    [product.image, product.imageBack],
  );

  const handleAdd = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (cannotPurchase) return;
      if (!selectedSize) {
        openRecto();
        return;
      }
      onAddToCart(product, selectedSize, event.currentTarget);
    },
    [cannotPurchase, selectedSize, openRecto, onAddToCart, product],
  );

  return (
    <article className="flex min-w-0 flex-col gap-3">
      <ProductCard
        className="h-full"
        productId={product.id}
        name={storefrontProductTitle(product, catalog)}
        variant={storefrontProductSubtitle(product, catalog)}
        image={product.image}
        price={product.price}
        soldOut={outOfStock}
        onPrefetch={onPrefetch}
        onClick={openRecto}
        wishlistActive={wishlistActive}
        onWishlistToggle={() => onToggleWishlist(rectoId)}
      />
      {sizes.length > 0 ? (
        <div className="flex flex-wrap gap-1" role="group" aria-label="Taille">
          {sizes.map((s) => {
            const active = selectedSize === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                className={`min-w-[2.25rem] border px-2 py-1 text-[9px] tracking-[0.14em] uppercase transition-colors ${
                  active
                    ? "border-white/70 bg-white/10 text-white"
                    : "border-white/15 text-white/45 hover:border-white/35 hover:text-white/75"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={cannotPurchase}
          className="dingry-add-to-cart-btn w-full border border-white/25 py-2.5 text-[10px] tracking-[0.2em] text-white uppercase transition-colors hover:border-white/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {cannotPurchase ? "Indisponible" : "Ajouter au panier"}
        </button>
        <button
          type="button"
          onClick={openRecto}
          className="w-full py-2 text-[10px] tracking-[0.18em] text-white/45 uppercase underline-offset-2 hover:text-white hover:underline"
        >
          Voir la fiche
        </button>
      </div>
    </article>
  );
}

export const WishlistGridItem = memo(WishlistGridItemInner);
