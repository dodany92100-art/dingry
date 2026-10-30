"use client";

import { cn } from "@/lib/utils";

type ProductImageFrameProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  glow?: boolean;
};

export function ProductImageFrame({
  src,
  alt,
  className,
  imageClassName,
  glow = true,
}: ProductImageFrameProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-[#0a0a0a]/60 md:rounded-[16px]",
        className,
      )}
      style={{ aspectRatio: "3/4" }}
    >
      {glow ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="absolute h-[58%] w-[78%] rounded-full bg-[#0066FF]/40 blur-3xl" />
          <div className="absolute h-[42%] w-[62%] rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="absolute h-[28%] w-[48%] rounded-full bg-white/10 blur-xl" />
        </div>
      ) : null}
      <img
        src={src}
        alt={alt}
        className={cn(
          "relative z-[1] h-full w-full object-contain object-center p-2",
          glow &&
            "drop-shadow-[0_18px_36px_rgba(0,102,255,0.35)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]",
          imageClassName,
        )}
      />
    </div>
  );
}
