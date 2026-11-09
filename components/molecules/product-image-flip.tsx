"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DingryCloudinaryImage } from "@/components/atoms/dingry-cloudinary-image";
import { cn } from "@/lib/utils";
import { CATALOG_CARD_IMAGE_WIDTH } from "@/lib/cloudinary-url";

/** Fenêtre pour distinguer double tap (flip) vs simple tap (modale) sur tactile. */
const DOUBLE_TAP_MS = 320;

function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const apply = () => setFine(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return fine;
}

export type ProductFlipSide = "recto" | "verso";

type ProductImageFlipProps = {
  frontImage: string;
  backImage?: string;
  side: ProductFlipSide;
  alt: string;
  /** 1re cellule : classes CSS peek / hint desktop (survol). */
  isFirstInGrid?: boolean;
  /** Animation CSS peek (première carte seulement, une fois par cycle). */
  showPeekAnimation?: boolean;
  priority?: boolean;
  soldOut?: boolean;
  /** Grille catalogue : même ratio sur toutes les cartes (prix alignés sur la ligne). */
  catalogGrid?: boolean;
  /** Modale fiche produit : une face, contain, sans track flip. */
  presentation?: "card" | "modal";
  className?: string;
  imgClassName?: string;
  /**
   * Simple tap sur l’image (après délai si produit flippable) : ouverture modale avec le côté courant.
   * Sans verso : appel immédiat.
   */
  onTap?: (side: ProductFlipSide) => void;
  /** Double tap rapide : bascule recto ↔ verso (produits avec verso uniquement). */
  onDoubleTapFlip?: () => void;
};

export function ProductImageFlip({
  frontImage,
  backImage,
  side,
  alt,
  isFirstInGrid = false,
  showPeekAnimation = false,
  priority = false,
  soldOut = false,
  catalogGrid = false,
  presentation = "card",
  className,
  imgClassName,
  onTap,
  onDoubleTapFlip,
}: ProductImageFlipProps) {
  const flippable = Boolean(backImage);
  const finePointer = useFinePointer();
  const trackInnerRef = useRef<HTMLDivElement>(null);
  const lastTapAtRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSingleTapTimer = useCallback(() => {
    if (singleTapTimerRef.current !== null) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearSingleTapTimer(), [clearSingleTapTimer]);

  const applyTrackTransform = useCallback(
    (animate: boolean) => {
      const el = trackInnerRef.current;
      if (!el) return;
      if (showPeekAnimation) {
        el.classList.remove("dingry-flip-track--dragging");
        el.classList.toggle("dingry-flip-track--verso", side === "verso");
        el.style.transform = "";
        return;
      }
      el.classList.toggle("dingry-flip-track--dragging", !animate);
      el.classList.toggle("dingry-flip-track--verso", side === "verso");
      if (isFirstInGrid && side === "recto" && animate) {
        el.style.transform = "";
        return;
      }
      const basePercent = side === "verso" ? -50 : 0;
      el.style.transform = `translate3d(${basePercent}%, 0, 0)`;
    },
    [showPeekAnimation, side, isFirstInGrid],
  );

  useEffect(() => {
    applyTrackTransform(true);
  }, [applyTrackTransform, side]);

  const handleImageClick = () => {
    if (showPeekAnimation) return;
    if (!onTap) return;

    if (!flippable || finePointer) {
      onTap(side);
      return;
    }

    if (!onDoubleTapFlip) {
      onTap(side);
      return;
    }

    const now = Date.now();
    const sinceLast = now - lastTapAtRef.current;

    if (sinceLast > 0 && sinceLast < DOUBLE_TAP_MS) {
      clearSingleTapTimer();
      lastTapAtRef.current = 0;
      onDoubleTapFlip();
      return;
    }

    lastTapAtRef.current = now;
    clearSingleTapTimer();
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      lastTapAtRef.current = 0;
      onTap(side);
    }, DOUBLE_TAP_MS);
  };

  const handleImageDoubleClick = (event: React.MouseEvent) => {
    if (showPeekAnimation || !flippable || !finePointer || !onDoubleTapFlip) return;
    event.preventDefault();
    clearSingleTapTimer();
    lastTapAtRef.current = 0;
    onDoubleTapFlip();
  };

  const cardW = priority ? 640 : CATALOG_CARD_IMAGE_WIDTH;

  const photoShellClass = cn(
    "dingry-product-photo relative touch-pan-y overflow-hidden [touch-action:pan-y]",
    catalogGrid
      ? "h-full w-full max-h-none"
      : "aspect-[3/4] lg:aspect-[4/5] lg:max-h-[22rem]",
    className,
  );

  if (presentation === "modal") {
    const src = side === "verso" && backImage?.trim() ? backImage : frontImage;
    return (
      <div className={cn("dingry-product-photo relative flex w-full justify-center", className)}>
        <DingryCloudinaryImage
          src={src}
          alt={side === "verso" ? `${alt} — verso` : alt}
          width={600}
          height={800}
          deliveryWidth={720}
          fitContent
          className={imgClassName}
          sizes="(max-width: 768px) 100vw, min(50vw, 600px)"
        />
      </div>
    );
  }

  if (!flippable) {
    return (
      <div
        className={photoShellClass}
        onClick={handleImageClick}
        onDoubleClick={handleImageDoubleClick}
        role={onTap ? "button" : undefined}
        tabIndex={onTap ? 0 : undefined}
      >
        <DingryCloudinaryImage
          src={frontImage}
          alt={alt}
          deliveryWidth={cardW}
          priority={priority}
          className={cn(
            "h-full w-full object-cover transition-[filter] duration-300 ease-out motion-reduce:transition-none",
            imgClassName,
            soldOut && "opacity-50",
          )}
        />
        {soldOut ? (
          <span className="pointer-events-none absolute left-2 top-2 bg-black/80 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-white">
            Épuisé
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        photoShellClass,
        isFirstInGrid && "dingry-flip-first-grid",
        showPeekAnimation && "dingry-flip-verso-peek-run",
      )}
      onClick={handleImageClick}
      onDoubleClick={handleImageDoubleClick}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      onKeyDown={
        onTap
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                // Clavier : ouverture modale directe (pas de double tap).
                clearSingleTapTimer();
                lastTapAtRef.current = 0;
                onTap(side);
              }
            }
          : undefined
      }
      aria-label={`${alt} — appuyer pour ouvrir, double appui pour recto ou verso`}
    >
      <div
        ref={trackInnerRef}
        className={cn(
          "dingry-flip-track flex h-full w-[200%] will-change-transform",
          side === "verso" && "dingry-flip-track--verso",
        )}
      >
        <DingryCloudinaryImage
          src={frontImage}
          alt={alt}
          deliveryWidth={cardW}
          priority={priority}
          className={cn(
            "h-full w-1/2 shrink-0 object-cover",
            imgClassName,
            soldOut && "opacity-50",
          )}
        />
        <DingryCloudinaryImage
          src={backImage ?? frontImage}
          alt={`${alt} — verso`}
          deliveryWidth={cardW}
          className={cn("h-full w-1/2 shrink-0 object-cover", imgClassName, soldOut && "opacity-50")}
        />
      </div>
      {isFirstInGrid && side === "recto" ? (
        <span className="dingry-flip-verso-hint pointer-events-none absolute right-2.5 top-2.5 z-[2] flex items-center gap-1.5 border border-white/10 bg-black/35 px-2.5 py-1 text-[7px] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md md:text-[8px]">
          <span aria-hidden className="text-[9px] font-light text-white/45">
            ←
          </span>
          Survoler pour verso
        </span>
      ) : (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-sm bg-black/55 px-2 py-0.5 text-[7px] uppercase tracking-[0.18em] text-white/70 sm:text-[8px] md:text-[9px]">
          {side === "recto" ? "Tap ouvrir · double tap verso" : "Tap ouvrir · double tap recto"}
        </span>
      )}
      {soldOut ? (
        <span className="pointer-events-none absolute left-2 top-2 bg-black/80 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-white">
          Épuisé
        </span>
      ) : null}
    </div>
  );
}
