"use client";

import { memo } from "react";
import { WishlistIconButton } from "@/components/atoms/wishlist-icon-button";
import { cn } from "@/lib/utils";
import { ProductImageFlip, type ProductFlipSide } from "@/components/molecules/product-image-flip";

export { cldOpt } from "@/lib/cloudinary-url";

const priceFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type ProductCardData = {
  name: string;
  variant: string;
  image: string;
  price: number;
};

type ProductCardProps = ProductCardData & {
  onClick?: (side: ProductFlipSide) => void;
  className?: string;
  /** Première cellule catalogue : LCP (lazy pour le reste). */
  priority?: boolean;
  /** Survol (desktop) : précharge les visuels modale. */
  onPrefetch?: () => void;
  soldOut?: boolean;
  wishlistActive?: boolean;
  onWishlistToggle?: () => void;
};

function ProductCardInner({
  name,
  variant,
  image,
  price,
  onClick,
  className,
  priority = false,
  soldOut = false,
  wishlistActive,
  onWishlistToggle,
  onPrefetch,
}: ProductCardProps) {
  return (
    <article
      className={cn("group w-full min-w-0 touch-pan-y", className)}
      onMouseEnter={() => onPrefetch?.()}
      onFocus={() => onPrefetch?.()}
    >
      <div className="w-full min-w-0 touch-pan-y text-left">
        <div className="relative">
          <ProductImageFlip
            frontImage={image}
            side="recto"
            priority={priority}
            soldOut={soldOut}
            alt={`${name} ${variant}`}
            imgClassName="transition-[filter] duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:brightness-[1.03]"
            onTap={onClick ? () => onClick("recto") : undefined}
          />
          {onWishlistToggle !== undefined && wishlistActive !== undefined ? (
            <div className="pointer-events-none absolute inset-0 z-[4]">
              <WishlistIconButton
                active={wishlistActive}
                label={wishlistActive ? "Retirer de la wishlist" : "Ajouter à la wishlist"}
                onClick={onWishlistToggle}
                stopPropagation
                className="pointer-events-auto absolute right-2 top-2 sm:right-2.5 sm:top-2.5"
              />
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onClick?.("recto")}
          disabled={!onClick}
          className="mt-1.5 w-full px-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:mt-2 md:mt-3"
        >
          <p className="dingry-product-ref dingry-product-ref--title">{name}</p>
          {variant ? (
            <div className="mt-0.5 flex items-start justify-between gap-1.5 sm:mt-1 sm:gap-2">
              <p className="dingry-product-ref dingry-product-ref--variant line-clamp-2 min-w-0">
                {variant}
              </p>
              <p className="dingry-product-price shrink-0">
                {priceFormat.format(price)}
              </p>
            </div>
          ) : (
            <p className="dingry-product-price mt-0.5 shrink-0 sm:mt-1">
              {priceFormat.format(price)}
            </p>
          )}
        </button>
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
