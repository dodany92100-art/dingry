"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { ProductCardCopy } from "@/components/molecules/product-card-copy";
import { ProductCardMedia } from "@/components/molecules/product-card-media";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";

export { cldOpt } from "@/lib/cloudinary-url";

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
  const openRecto = onClick
    ? () => {
        onClick("recto");
      }
    : undefined;
  const alt = `${name} ${variant}`.trim();

  return (
    <article
      data-dingry-product-card-open=""
      className={cn(
        "dingry-product-card group flex h-full w-full min-w-0 flex-col overflow-hidden touch-pan-y",
        onClick && "cursor-pointer [touch-action:manipulation]",
        className,
      )}
      onMouseEnter={() => onPrefetch?.()}
      onFocus={() => onPrefetch?.()}
      onClick={
        openRecto
          ? (event) => {
              if ((event.target as HTMLElement).closest("[data-dingry-wishlist]")) return;
              openRecto();
            }
          : undefined
      }
      onKeyDown={
        openRecto
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openRecto();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <ProductCardMedia
        image={image}
        alt={alt}
        priority={priority}
        soldOut={soldOut}
        wishlistActive={wishlistActive}
        onWishlistToggle={onWishlistToggle}
      />
      <ProductCardCopy name={name} variant={variant} price={price} />
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
