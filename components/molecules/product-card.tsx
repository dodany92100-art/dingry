"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ProductImageFlip, type ProductFlipSide } from "@/components/molecules/product-image-flip";

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

/** Durées alignées sur `dingry-flip-verso-peek` (globals.css) : delay 1,05s + 2×1,85s + marge. */
const PEEK_ANIMATION_MS = 1050 + 1850 * 2 + 160;
/** Délai avant l’aperçu automatique recto → verso → recto (première carte seulement). */
const AUTO_PEEK_START_DELAY_MS = 1500;

type ProductCardData = {
  name: string;
  variant: string;
  image: string;
  price: number;
};

type ProductCardProps = ProductCardData & {
  backImage?: string;
  /** 1re cellule de la grille : micro-slide CSS + hint « Survoler » (desktop). */
  isFirstInGrid?: boolean;
  /**
   * Première carte du catalogue affiché : démo auto recto ↔ verso après montage.
   * Changement de `peekResetKey` (ex. filtre catégorie) relance l’aperçu sur la nouvelle 1ʳᵉ carte.
   */
  isFirstProduct?: boolean;
  peekResetKey?: string | number;
  onClick?: (side: ProductFlipSide) => void;
  className?: string;
  /** Première rangée visible : charge l’image en priorité (LCP). */
  priority?: boolean;
  soldOut?: boolean;
};

export function ProductCard({
  name,
  variant,
  image,
  backImage,
  isFirstInGrid = false,
  isFirstProduct = false,
  peekResetKey,
  price,
  onClick,
  className,
  priority = false,
  soldOut = false,
}: ProductCardProps) {
  const [side, setSide] = useState<ProductFlipSide>("recto");
  /** `true` uniquement pendant l’animation CSS peek (pas pendant le délai 1,5s — la carte reste interactive). */
  const [showPeekAnimation, setShowPeekAnimation] = useState(false);
  const flippable = Boolean(backImage);
  const peekCycleId = useRef(0);

  useEffect(() => {
    peekCycleId.current += 1;
    setSide("recto");
    setShowPeekAnimation(false);
  }, [peekResetKey]);

  useEffect(() => {
    if (!isFirstProduct || !flippable) return;

    const cycle = peekCycleId.current;
    const startTimer = window.setTimeout(() => {
      if (peekCycleId.current !== cycle) return;
      setShowPeekAnimation(true);
    }, AUTO_PEEK_START_DELAY_MS);

    const endTimer = window.setTimeout(() => {
      if (peekCycleId.current !== cycle) return;
      setShowPeekAnimation(false);
    }, AUTO_PEEK_START_DELAY_MS + PEEK_ANIMATION_MS);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [isFirstProduct, flippable, peekResetKey]);

  const handleDoubleTapFlip = useCallback(() => {
    if (!flippable) return;
    setSide((s) => (s === "recto" ? "verso" : "recto"));
  }, [flippable]);

  return (
    <article className={cn("group w-full min-w-0 touch-pan-y", className)}>
      <div className="w-full min-w-0 touch-pan-y rounded-lg text-left sm:rounded-xl md:rounded-2xl">
        <ProductImageFlip
          frontImage={image}
          backImage={backImage}
          side={side}
          onSideChange={setSide}
          isFirstInGrid={isFirstInGrid}
          showPeekAnimation={showPeekAnimation}
          priority={priority}
          soldOut={soldOut}
          alt={`${name} ${variant}`}
          imgClassName="transition-[filter] duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:brightness-[1.03]"
          onTap={onClick}
          onDoubleTapFlip={flippable ? handleDoubleTapFlip : undefined}
        />
        <button
          type="button"
          onClick={() => onClick?.(side)}
          disabled={!onClick}
          className="mt-1.5 w-full px-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:mt-2 md:mt-3"
        >
          <p className="text-[8px] uppercase leading-tight tracking-[0.16em] text-white/45 sm:text-[9px] md:text-[10px] md:tracking-[0.22em]">
            {name}
          </p>
          {variant ? (
            <div className="mt-0.5 flex items-start justify-between gap-1.5 sm:mt-1 sm:gap-2">
              <p className="line-clamp-2 min-w-0 text-xs font-medium uppercase leading-snug tracking-wide text-neutral-100 md:text-sm md:tracking-widest">
                {variant}
              </p>
              <p className="shrink-0 text-xs font-bold tabular-nums tracking-tight text-white sm:text-sm md:text-base">
                {priceFormat.format(price)}
              </p>
            </div>
          ) : (
            <p className="mt-0.5 text-xs font-bold tabular-nums tracking-tight text-white sm:mt-1 sm:text-sm md:text-base">
              {priceFormat.format(price)}
            </p>
          )}
        </button>
      </div>
    </article>
  );
}
