"use client";

import { cn } from "@/lib/utils";

export type ProductCardData = {
  name: string;
  variant: string;
  description: string;
  image: string;
  price: number;
};

type ProductCardProps = ProductCardData & {
  onClick?: () => void;
  className?: string;
};

export function ProductCard({
  name,
  variant,
  image,
  price,
  onClick,
  className,
}: ProductCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/85 p-2.5 transition-colors duration-300 hover:border-white/[0.14] sm:p-3 md:rounded-[22px] md:p-4",
        className,
      )}
    >
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="relative overflow-hidden rounded-xl md:rounded-[16px]" style={{ aspectRatio: "3/4" }}>
          <img
            src={image}
            alt={`${name} ${variant}`}
            className="h-full w-full object-cover"
            style={{ filter: "brightness(0.88) contrast(1.05) grayscale(0.15)" }}
          />
        </div>
        <div className="mt-2 md:mt-3">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/40 md:text-[10px] md:tracking-[0.22em]">
            {name}
          </p>
          <div className="mt-1 flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[11px] font-medium uppercase leading-snug tracking-wide text-neutral-200 md:text-sm md:tracking-widest">
              {variant}
            </p>
            <p className="shrink-0 text-sm font-bold tabular-nums tracking-tight text-white md:text-base">
              {price}€
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
