"use client";

import { memo } from "react";
import { WishlistIconButton } from "@/components/atoms/wishlist-icon-button";
import { ProductCardCopy } from "@/components/molecules/product-card-copy";
import { ProductCardMedia } from "@/components/molecules/product-card-media";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import { cn } from "@/lib/utils";

export { deliveryImageUrl as cldOpt } from "@/lib/media/delivery-image-url";

type ProductCardData = {
  name: string;
  variant: string;
  image: string;
  price: number;
};

type ProductCardProps = ProductCardData & {
  /** Id fiche CRM — n’affiche le badge #ID que si {@link showAdminIdBadge} est vrai (admin uniquement). */
  productId?: string | number;
  imageFallback?: string;
  showAdminIdBadge?: boolean;
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
  productId,
  showAdminIdBadge = false,
  name,
  variant,
  image,
  imageFallback,
  price,
  onClick,
  className,
  priority = false,
  soldOut = false,
  wishlistActive,
  onWishlistToggle,
  onPrefetch,
}: ProductCardProps) {
  const openRecto = onClick
    ? () => {
        onClick("recto");
      }
    : undefined;
  const alt = `${name} ${variant}`.trim();
  const wishlistVisible = onWishlistToggle !== undefined && wishlistActive !== undefined;
  const openLabel = `Ouvrir la fiche : ${alt}`;

  const media = (
    <ProductCardMedia
      productId={productId}
      showAdminIdBadge={showAdminIdBadge}
      image={image}
      imageFallback={imageFallback}
      alt={alt}
      priority={priority}
      soldOut={soldOut}
      wishlistActive={openRecto ? undefined : wishlistActive}
      onWishlistToggle={openRecto ? undefined : onWishlistToggle}
    />
  );
  const copy = <ProductCardCopy name={name} variant={variant} price={price} />;

  return (
    <article
      className={cn(
        "dingry-product-card group relative flex h-full w-full min-w-0 flex-col overflow-hidden touch-pan-y",
        openRecto && "[touch-action:manipulation]",
        className,
      )}
      onMouseEnter={() => onPrefetch?.()}
    >
      {openRecto ? (
        <button
          type="button"
          data-dingry-product-card-open=""
          aria-label={openLabel}
          className="flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden border-0 bg-transparent p-0 text-left"
          onFocus={() => onPrefetch?.()}
          onClick={openRecto}
        >
          {media}
          {copy}
        </button>
      ) : (
        <>
          {media}
          {copy}
        </>
      )}
      {openRecto && wishlistVisible ? (
        <div
          data-dingry-wishlist
          className="absolute right-2 top-2 z-20 sm:right-2.5 sm:top-2.5"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <WishlistIconButton
            active={wishlistActive}
            label={wishlistActive ? "Retirer de la wishlist" : "Ajouter à la wishlist"}
            onClick={onWishlistToggle}
            stopPropagation
          />
        </div>
      ) : null}
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
