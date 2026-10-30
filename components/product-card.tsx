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
    <article className={cn("group", className)}>
      <button type="button" onClick={onClick} className="w-full text-left">
        <div
          className="dingry-product-photo relative overflow-hidden rounded-xl md:rounded-2xl"
          style={{ aspectRatio: "3/4" }}
        >
          <img
            src={image}
            alt={`${name} ${variant}`}
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.02] group-hover:brightness-[1.03]"
          />
        </div>
        <div className="mt-2 px-0.5 md:mt-3">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/45 md:text-[10px] md:tracking-[0.22em]">
            {name}
          </p>
          <div className="mt-1 flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[11px] font-medium uppercase leading-snug tracking-wide text-neutral-100 md:text-sm md:tracking-widest">
              {variant}
            </p>
            <p className="shrink-0 text-sm font-bold tabular-nums tracking-tight text-white md:text-base">
              {price}€
            </p>
          </div>
        </div>
      </button>
    </article>
  );
}
