"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { cldOpt } from "@/components/product-card";

const SWIPE_THRESHOLD_PX = 48;
const DRAG_CLICK_GUARD_PX = 12;

export type ProductFlipSide = "recto" | "verso";

type ProductImageFlipProps = {
  frontImage: string;
  backImage?: string;
  side: ProductFlipSide;
  onSideChange?: (side: ProductFlipSide) => void;
  alt: string;
  /** Micro-animation pour apprendre le geste (première carte du catalogue). */
  swipeHint?: boolean;
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
  swipeHint = false,
  priority = false,
  soldOut = false,
  className,
  imgClassName,
  onTap,
}: ProductImageFlipProps) {
  const flippable = Boolean(backImage);
  const trackRef = useRef<HTMLDivElement>(null);
  const trackInnerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragDelta = useRef(0);
  const didDrag = useRef(false);
  const [hintDone, setHintDone] = useState(false);
  const showHint = swipeHint && flippable && !hintDone && side === "recto";

  useEffect(() => {
    if (!showHint) return;
    const timer = window.setTimeout(() => setHintDone(true), 5200);
    return () => window.clearTimeout(timer);
  }, [showHint]);

  const applyTrackTransform = useCallback(
    (dragPx: number, animate: boolean) => {
      const el = trackInnerRef.current;
      if (!el || showHint) return;
      el.classList.toggle("dingry-flip-track--dragging", !animate);
      const basePercent = side === "verso" ? -50 : 0;
      el.style.transform = `translateX(calc(${basePercent}% + ${dragPx}px))`;
    },
    [showHint, side],
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
    if (!flippable) return;
    didDrag.current = false;
    dragStartX.current = event.clientX;
    dragDelta.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!flippable || dragStartX.current === null) return;
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
    if (!flippable) return;
    finishDrag();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onClick = () => {
    if (didDrag.current) {
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
          "dingry-product-photo relative aspect-[3/4] overflow-hidden rounded-xl md:rounded-2xl",
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

  return (
    <div
      ref={trackRef}
      className={cn(
        "dingry-product-photo relative aspect-[3/4] touch-pan-y overflow-hidden rounded-xl md:rounded-2xl",
        flippable && "cursor-grab active:cursor-grabbing",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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
      aria-label={flippable ? `${alt} — glisser pour voir le verso` : alt}
    >
      <div
        ref={trackInnerRef}
        className={cn(
          "dingry-flip-track flex h-full w-[200%] will-change-transform",
          showHint && "dingry-flip-swipe-hint",
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
      <span className="pointer-events-none absolute bottom-2 left-2 rounded-sm bg-black/55 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-white/70 md:text-[9px]">
        {side === "recto" ? "Glisser → verso" : "← Recto"}
      </span>
      {soldOut ? (
        <span className="pointer-events-none absolute left-2 top-2 bg-black/80 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-white">
          Épuisé
        </span>
      ) : null}
    </div>
  );
}
