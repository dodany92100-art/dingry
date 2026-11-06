"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

type BackgroundGradientAnimationProps = {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  interactive?: boolean;
  containerClassName?: string;
};

export function BackgroundGradientAnimation({
  gradientBackgroundStart = "#10141c",
  gradientBackgroundEnd = "#3d4658",
  firstColor = "0, 102, 255",
  secondColor = "255, 255, 255",
  thirdColor = "28, 160, 251",
  fourthColor = "0, 50, 120",
  fifthColor = "245, 247, 250",
  pointerColor = "0, 102, 255",
  size = "75%",
  blendingValue = "soft-light",
  interactive = true,
  containerClassName,
}: BackgroundGradientAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const interactiveRef = useRef<HTMLDivElement>(null);
  const curX = useRef(0);
  const curY = useRef(0);
  const tgX = useRef(0);
  const tgY = useRef(0);

  useEffect(() => {
    if (!interactive) return;

    let frame = 0;
    const tick = () => {
      curX.current += (tgX.current - curX.current) / 18;
      curY.current += (tgY.current - curY.current) / 18;
      if (interactiveRef.current) {
        interactiveRef.current.style.transform = `translate(${Math.round(curX.current)}px, ${Math.round(curY.current)}px)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [interactive]);

  useEffect(() => {
    if (!interactive) return;

    function onMove(event: MouseEvent) {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      tgX.current = event.clientX - bounds.left;
      tgY.current = event.clientY - bounds.top;
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [interactive]);

  const cssVars = {
    "--gradient-background-start": gradientBackgroundStart,
    "--gradient-background-end": gradientBackgroundEnd,
    "--size": size,
    "--blending-value": blendingValue,
  } as CSSProperties;

  const blobClass =
    "dingry-bga-orb absolute [background:radial-gradient(circle_at_center,_rgba(var(--blob-color),_0.75)_0,_rgba(var(--blob-color),_0)_50%)_no-repeat] [mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] opacity-70";

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={cssVars}
      className={cn(
        "dingry-bga pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
        containerClassName,
      )}
    >
      <div className="absolute inset-0 blur-3xl">
        <div
          className={cn(blobClass, "dingry-bga-first [transform-origin:center_center]")}
          style={{ "--blob-color": firstColor } as CSSProperties}
        />
        <div
          className={cn(blobClass, "dingry-bga-second [transform-origin:calc(50%-400px)]")}
          style={{ "--blob-color": secondColor } as CSSProperties}
        />
        <div
          className={cn(blobClass, "dingry-bga-third [transform-origin:calc(50%+400px)]")}
          style={{ "--blob-color": thirdColor } as CSSProperties}
        />
        <div
          className={cn(blobClass, "dingry-bga-fourth hidden sm:block [transform-origin:calc(50%-200px)]")}
          style={{ "--blob-color": fourthColor } as CSSProperties}
        />
        <div
          className={cn(blobClass, "dingry-bga-fifth hidden md:block [transform-origin:calc(50%-800px)_calc(50%+800px)]")}
          style={{ "--blob-color": fifthColor } as CSSProperties}
        />
        {interactive ? (
          <div
            ref={interactiveRef}
            className="absolute -top-1/2 -left-1/2 h-full w-full opacity-50 [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.65)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat] [mix-blend-mode:var(--blending-value)]"
            style={{ "--pointer-color": pointerColor } as CSSProperties}
          />
        ) : null}
      </div>
    </div>
  );
}
