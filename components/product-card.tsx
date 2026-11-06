"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductImageFlip, type ProductFlipSide } from "@/components/product-image-flip";

/** Ajoute f_auto,q_auto,w_N à une URL Cloudinary sans transformation existante. */
export function cldOpt(url: string, width: number): string {
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || index < 0) return url;
  const rest = url.slice(index + marker.length);
  // Segment de transformation déjà présent (ex. "f_auto,q_auto,w_600/").
  if (/^[a-z]{1,3}_[^/]*\//.test(rest)) return url;
  return `${url.slice(0, index + marker.length)}f_auto,q_auto,w_${width}/${rest}`;
}

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
  backImage?: string;
  swipeHint?: boolean;
  onClick?: (side: ProductFlipSide) => void;
  className?: string;
  /** Première rangée visible : charge l'image en priorité (LCP). */
  priority?: boolean;
  soldOut?: boolean;
};

export function ProductCard({
  name,
  variant,
  image,
  backImage,
  swipeHint = false,
  price,
  onClick,
  className,
  priority = false,
  soldOut = false,
}: ProductCardProps) {
  const [side, setSide] = useState<ProductFlipSide>("recto");

  return (
    <article className={cn("group", className)}>
      <div className="w-full rounded-xl text-left md:rounded-2xl">
        <ProductImageFlip
          frontImage={image}
          backImage={backImage}
          side={side}
          onSideChange={setSide}
          swipeHint={swipeHint}
          priority={priority}
          soldOut={soldOut}
          alt={`${name} ${variant}`}
          imgClassName="transition-[filter] duration-300 ease-out motion-reduce:transition-none group-hover:brightness-[1.03]"
          onTap={onClick ? (nextSide) => onClick(nextSide) : undefined}
        />
        <button
          type="button"
          onClick={() => onClick?.(side)}
          disabled={!onClick}
          className="mt-2 w-full px-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:mt-3"
        >
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/45 md:text-[10px] md:tracking-[0.22em]">
            {name}
          </p>
          {variant ? (
            <div className="mt-1 flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-[11px] font-medium uppercase leading-snug tracking-wide text-neutral-100 md:text-sm md:tracking-widest">
                {variant}
              </p>
              <p className="shrink-0 text-sm font-bold tabular-nums tracking-tight text-white md:text-base">
                {priceFormat.format(price)}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm font-bold tabular-nums tracking-tight text-white md:text-base">
              {priceFormat.format(price)}
            </p>
          )}
        </button>
      </div>
    </article>
  );
}
