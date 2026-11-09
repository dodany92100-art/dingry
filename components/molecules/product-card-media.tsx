"use client";

import { memo } from "react";
import { WishlistIconButton } from "@/components/atoms/wishlist-icon-button";
import { ProductImageFlip } from "@/components/molecules/product-image-flip";

type ProductCardMediaProps = {
  image: string;
  alt: string;
  priority?: boolean;
  soldOut?: boolean;
  wishlistActive?: boolean;
  onWishlistToggle?: () => void;
};

function ProductCardMediaInner({
  image,
  alt,
  priority = false,
  soldOut = false,
  wishlistActive,
  onWishlistToggle,
}: ProductCardMediaProps) {
  const wishlistVisible = onWishlistToggle !== undefined && wishlistActive !== undefined;

  return (
    <div className="dingry-product-card__media relative aspect-[3/4] w-full shrink-0 overflow-hidden">
      <ProductImageFlip
        frontImage={image}
        side="recto"
        priority={priority}
        soldOut={soldOut}
        catalogGrid
        alt={alt}
        className="absolute inset-0 h-full w-full"
        imgClassName="transition-[filter] duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:brightness-[1.03]"
      />
      {wishlistVisible ? (
        <div data-dingry-wishlist className="absolute right-2 top-2 z-10 sm:right-2.5 sm:top-2.5">
          <WishlistIconButton
            active={wishlistActive}
            label={wishlistActive ? "Retirer de la wishlist" : "Ajouter à la wishlist"}
            onClick={onWishlistToggle}
            stopPropagation
          />
        </div>
      ) : null}
    </div>
  );
}

export const ProductCardMedia = memo(ProductCardMediaInner);
