"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

type InfiniteMovingCardsProps = {
  children: ReactNode;
  className?: string;
  /** Durée d’un cycle complet (deux copies = -50 %). */
  durationSeconds?: number;
  ariaLabel?: string;
};

function wrapOffset(offset: number, loop: number): number {
  if (loop <= 0) return 0;
  const mod = ((offset % loop) + loop) % loop;
  return mod === 0 ? 0 : mod - loop;
}

export function InfiniteMovingCards({
  children,
  className,
  durationSeconds = 42,
  ariaLabel,
}: InfiniteMovingCardsProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startOffset: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();

    const apply = () => {
      const loop = track.scrollWidth / 2;
      offsetRef.current = wrapOffset(offsetRef.current, loop);
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduceMotion && !dragRef.current && !pausedRef.current) {
        const loop = track.scrollWidth / 2;
        if (loop > 0) {
          offsetRef.current -= (loop / durationSeconds) * dt;
          apply();
        }
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      offsetRef.current -= event.deltaX;
      apply();
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.cancelAnimationFrame(frame);
      viewport.removeEventListener("wheel", onWheel);
    };
  }, [durationSeconds]);

  function applyOffset() {
    const track = trackRef.current;
    if (!track) return;
    const loop = track.scrollWidth / 2;
    offsetRef.current = wrapOffset(offsetRef.current, loop);
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  }

  function onPointerEnter() {
    pausedRef.current = true;
  }

  function onPointerLeave() {
    if (dragRef.current?.moved) return;
    pausedRef.current = false;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    pausedRef.current = true;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: offsetRef.current,
      moved: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    offsetRef.current = drag.startOffset + delta;
    applyOffset();
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) suppressClickRef.current = true;
    dragRef.current = null;
    const viewport = viewportRef.current;
    if (event.pointerType === "touch" || (viewport && !viewport.matches(":hover"))) {
      pausedRef.current = false;
    }
  }

  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div
      ref={viewportRef}
      className={cn(
        "dingry-infinite-cards relative w-full cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing",
        className,
      )}
      aria-label={ariaLabel}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      <div
        ref={trackRef}
        className="dingry-marquee-track dingry-marquee-track--manual flex w-max items-stretch gap-4 py-3 md:gap-6 md:py-4"
      >
        {children}
      </div>
    </div>
  );
}
