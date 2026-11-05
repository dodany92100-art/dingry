"use client";

import { cn } from "@/lib/utils";

const CLD_WIDTHS = [300, 450, 600, 900] as const;

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

export type ProductCardData = {
  name: string;
  variant: string;
  image: string;
  price: number;
};

type ProductCardProps = ProductCardData & {
  onClick?: () => void;
  className?: string;
  /** Première rangée visible : charge l'image en priorité (LCP). */
  priority?: boolean;
  soldOut?: boolean;
};

export function ProductCard({
  name,
  variant,
  image,
  price,
  onClick,
  className,
  priority = false,
  soldOut = false,
}: ProductCardProps) {
  const srcSet = CLD_WIDTHS.map((w) => `${cldOpt(image, w)} ${w}w`).join(", ");

  return (
    <article className={cn("group", className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:rounded-2xl"
      >
        <div className="dingry-product-photo relative aspect-[3/4] overflow-hidden rounded-xl md:rounded-2xl">
          <img
            src={cldOpt(image, 600)}
            srcSet={srcSet}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            alt={`${name} ${variant}`}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            width={600}
            height={800}
            className={cn(
              "h-full w-full object-cover transition duration-500 ease-out motion-reduce:transition-none",
              "group-hover:scale-[1.02] group-hover:brightness-[1.03] motion-reduce:group-hover:scale-100",
              soldOut && "opacity-50",
            )}
          />
          {soldOut ? (
            <span className="absolute left-2 top-2 bg-black/80 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-white">
              Épuisé
            </span>
          ) : null}
        </div>
        <div className="mt-2 px-0.5 md:mt-3">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/45 md:text-[10px] md:tracking-[0.22em]">
            {name}
          </p>
          {variant ? (
          <div className="mt-1 flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[11px] font-medium uppercase leading-snug tracking-wide text-neutral-100 md:text-sm md:tracking-widest">
              {variant}
            </p>
            <p className="shrink-0 text-sm font-bold tabular-nums tracking-tight text-white md:text-base">
              {priceFormat.format(price)}
            </p>
          </div>
          ) : (
          <p className="mt-1 text-sm font-bold tabular-nums tracking-tight text-white md:text-base">
            {priceFormat.format(price)}
          </p>
          )}
        </div>
      </button>
    </article>
  );
}