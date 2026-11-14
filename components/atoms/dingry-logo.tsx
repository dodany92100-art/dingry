"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DINGRY_LOGO_URL } from "@/lib/dingry-brand";

type DingryLogoProps = {
  className?: string;
  animate?: boolean;
  interactive?: boolean;
  shimmer?: boolean;
  /** Fond clair (checkout, modale blog…) — wordmark en noir. */
  tone?: "on-dark" | "on-light";
};

const LERP = 0.14;
const MAX_RX = 50;
const MAX_RY = 28;

function DingryLogoInteractive({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const reduced = useRef(false);
  const tracking = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!el || reduced.current) return;

    let frame = 0;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;
      const rx = current.current.x;
      const ry = current.current.y;
      const fold = Math.max(0, rx / MAX_RX);
      const dive = Math.max(0, -rx / MAX_RX);
      const scaleY = 1 - fold * 0.42 - dive * 0.14;
      const scaleX = 1 + fold * 0.2 + (Math.abs(ry) / MAX_RY) * 0.1;
      const tz = -fold * 18 + dive * 6;
      el.style.transformOrigin = "50% 36%";
      el.style.transform = `perspective(720px) translate3d(0, 0, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  function aim(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el || reduced.current) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1) return;
    const nx = (clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (clientY - (r.top + r.height / 2)) / (r.height / 2);
    target.current.y = Math.max(-MAX_RY, Math.min(MAX_RY, nx * MAX_RY));
    target.current.x = Math.max(-MAX_RX, Math.min(MAX_RX, -ny * MAX_RX));
  }

  function reset() {
    tracking.current = false;
    target.current.x = 0;
    target.current.y = 0;
  }

  return (
    <span
      ref={ref}
      className="dingry-gpu-layer inline-flex cursor-pointer [transform-style:preserve-3d]"
      style={{ willChange: "transform" }}
      onPointerEnter={(e) => {
        tracking.current = true;
        aim(e.clientX, e.clientY);
      }}
      onPointerMove={(e: ReactPointerEvent<HTMLSpanElement>) => {
        if (tracking.current) aim(e.clientX, e.clientY);
      }}
      onPointerLeave={reset}
    >
      {children}
    </span>
  );
}

export function DingryLogo({
  className,
  animate = true,
  interactive = false,
  shimmer = false,
  tone = "on-dark",
}: DingryLogoProps) {
  const img = (
    <img
      src={DINGRY_LOGO_URL}
      alt="DINGRY Paris"
      draggable={false}
      className={cn(
        "relative z-[1] h-[2.875rem] w-auto max-md:max-h-[2.875rem] md:h-14",
        tone === "on-light" && "dingry-logo-on-light",
        animate && !interactive && !shimmer && "dingry-logo-flip",
        className,
      )}
      decoding="async"
    />
  );

  let node: ReactNode = img;
  if (shimmer) node = <span className="dingry-shimmer-logo-img dingry-gpu-layer">{node}</span>;
  if (interactive) node = <DingryLogoInteractive>{node}</DingryLogoInteractive>;
  return node;
}
