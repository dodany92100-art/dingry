"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { cldOpt } from "@/components/molecules/product-card";

const SWIPE_THRESHOLD_PX = 48;
const DRAG_CLICK_GUARD_PX = 12;

/** Souris / trackpad : drag flip. Tactile (pointer coarse) : pas de drag — scroll natif + tap pour ouvrir la fiche. */
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
  onSideChange?: (side: ProductFlipSide) => void;
  alt: string;
  /** Micro-slide verso : ancré sur la 1re cellule physique de la grille (index 0). */
  isFirstInGrid?: boolean;
  priority?: boolean;
  soldOut?: boolean;
  className?: string;
  imgClassName?: string;
  onTap?: (side: ProductFlipSide) => void;
};

export function ProductImageFlip({
  frontImage,
  backImage,
  side,
  onSideChange,
  alt,
  isFirstInGrid = false,
  priority = false,
  soldOut = false,
  className,
  imgClassName,
  onTap,
}: ProductImageFlipProps) {
  const flippable = Boolean(backImage);
  const dragFlipEnabled = useFinePointer();
  const trackRef = useRef<HTMLDivElement>(null);
  const trackInnerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragDelta = useRef(0);
  const didDrag = useRef(false);
  const [peekRunDone, setPeekRunDone] = useState(false);
  const showPeekRun =
    dragFlipEnabled && isFirstInGrid && flippable && !peekRunDone && side === "recto";

  useEffect(() => {
    if (!showPeekRun) return;
    const timer = window.setTimeout(() => setPeekRunDone(true), 1050 + 1850 * 2 + 160);
    return () => window.clearTimeout(timer);
  }, [showPeekRun]);

  const applyTrackTransform = useCallback(
    (dragPx: number, animate: boolean) => {
      const el = trackInnerRef.current;
      if (!el || showPeekRun) return;
      el.classList.toggle("dingry-flip-track--dragging", !animate);
      el.classList.toggle("dingry-flip-track--verso", side === "verso");
      if (isFirstInGrid && side === "recto" && dragPx === 0 && animate) {
        el.style.transform = "";
        return;
      }
      const basePercent = side === "verso" ? -50 : 0;
      el.style.transform = `translate3d(calc(${basePercent}% + ${dragPx}px), 0, 0)`;
    },
    [showPeekRun, side, isFirstInGrid],
  );

  useEffect(() => {
    applyTrackTransform(0, true);
  }, [applyTrackTransform, side]);

  const commitSide = useCallback(
    (next: ProductFlipSide) => {
      if (!flippable || next === side) return;
      onSideChange?.(next);
    },
    [flippable, onSideChange, side],
  );

  const finishDrag = useCallback(() => {
    const delta = dragDelta.current;
    dragStartX.current = null;
    applyTrackTransform(0, true);
    if (!flippable || Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0 && side === "recto") commitSide("verso");
    if (delta > 0 && side === "verso") commitSide("recto");
  }, [applyTrackTransform, commitSide, flippable, side]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (!flippable || !dragFlipEnabled) return;
    didDrag.current = false;
    dragStartX.current = event.clientX;
    dragDelta.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!flippable || !dragFlipEnabled || dragStartX.current === null) return;
    const width = trackRef.current?.clientWidth ?? 1;
    const delta = event.clientX - dragStartX.current;
    dragDelta.current = delta;
    if (Math.abs(delta) > DRAG_CLICK_GUARD_PX) didDrag.current = true;
    const atRecto = side === "recto";
    const clamped =
      atRecto ? Math.min(0, Math.max(-width, delta)) : Math.max(0, Math.min(width, delta));
    applyTrackTransform(clamped, false);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (!flippable || !dragFlipEnabled) return;
    finishDrag();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onClick = () => {
    if (dragFlipEnabled && didDrag.current) {
      didDrag.current = false;
      return;
    }
    onTap?.(side);
  };

  const frontSrc = cldOpt(frontImage, 600);
  const backSrc = backImage ? cldOpt(backImage, 600) : frontSrc;

  if (!flippable) {
    return (
      <div
        className={cn(
          "dingry-product-photo relative aspect-[3/4] touch-pan-y overflow-hidden rounded-xl md:rounded-2xl",
          className,
        )}
        onClick={() => onTap?.("recto")}
        role={onTap ? "button" : undefined}
        tabIndex={onTap ? 0 : undefined}
      >
        <img
          src={frontSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          width={600}
          height={800}
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

  const pointerHandlers = dragFlipEnabled
    ? {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: onPointerUp,
      }
    : {};

  return (
    <div
      ref={trackRef}
      className={cn(
        "dingry-product-photo relative aspect-[3/4] touch-pan-y overflow-hidden rounded-xl md:rounded-2xl",
        flippable && dragFlipEnabled && "cursor-grab active:cursor-grabbing",
        isFirstInGrid && flippable && dragFlipEnabled && "dingry-flip-first-grid",
        showPeekRun && "dingry-flip-verso-peek-run",
        className,
      )}
      {...pointerHandlers}
      onClick={onClick}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      onKeyDown={
        onTap
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onTap(side);
              }
            }
          : undefined
      }
      aria-label={
        flippable
          ? dragFlipEnabled
            ? `${alt} — glisser pour voir le verso`
            : `${alt} — appuyer pour ouvrir la fiche`
          : alt
      }
    >
      <div
        ref={trackInnerRef}
        className={cn(
          "dingry-flip-track flex h-full w-[200%] will-change-transform",
          side === "verso" && "dingry-flip-track--verso",
        )}
      >
        <img
          src={frontSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          width={600}
          height={800}
          draggable={false}
          className={cn(
            "h-full w-1/2 shrink-0 object-cover",
            imgClassName,
            soldOut && "opacity-50",
          )}
        />
        <img
          src={backSrc}
          alt={`${alt} — verso`}
          loading="lazy"
          decoding="async"
          width={600}
          height={800}
          draggable={false}
          className={cn("h-full w-1/2 shrink-0 object-cover", imgClassName, soldOut && "opacity-50")}
        />
      </div>
      {isFirstInGrid && side === "recto" && dragFlipEnabled ? (
        <span className="dingry-flip-verso-hint pointer-events-none absolute right-2.5 top-2.5 z-[2] flex items-center gap-1.5 border border-white/10 bg-black/35 px-2.5 py-1 text-[7px] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md md:text-[8px]">
          <span aria-hidden className="text-[9px] font-light text-white/45">
            ←
          </span>
          Survoler pour verso
        </span>
      ) : flippable && !dragFlipEnabled ? (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-sm bg-black/55 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-white/70 md:text-[9px]">
          Appuyer pour ouvrir
        </span>
      ) : dragFlipEnabled ? (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-sm bg-black/55 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-white/70 md:text-[9px]">
          {side === "recto" ? "Glisser → verso" : "← Recto"}
        </span>
      ) : null}
      {soldOut ? (
        <span className="pointer-events-none absolute left-2 top-2 bg-black/80 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-white">
          Épuisé
        </span>
      ) : null}
    </div>
  );
}
