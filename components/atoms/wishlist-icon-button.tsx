"use client";

import { cn } from "@/lib/utils";

type WishlistIconButtonProps = {
  active: boolean;
  /** Libellé accessible (ex. « Ajouter à la wishlist »). */
  label: string;
  onClick: () => void;
  /** Carte produit : empêche l’ouverture du modal au clic sur le cœur. */
  stopPropagation?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function WishlistIconButton({
  active,
  label,
  onClick,
  stopPropagation = false,
  size = "sm",
  className,
}: WishlistIconButtonProps) {
  const iconSize = size === "md" ? 22 : 18;
  const hit = size === "md" ? "h-11 w-11" : "h-9 w-9";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={(event) => {
        if (stopPropagation) {
          event.stopPropagation();
          event.preventDefault();
        }
        onClick();
      }}
      className={cn(
        "dingry-interactive-luxe flex items-center justify-center rounded-md transition-[color,opacity,transform] duration-200",
        hit,
        active
          ? "text-[#7EB3FF]/95 drop-shadow-[0_0_12px_rgba(0,102,255,0.35)]"
          : "text-white/40 hover:text-white/75",
        className,
      )}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        className="shrink-0"
        aria-hidden
      >
        <path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          fillOpacity={active ? 0.35 : 0}
        />
      </svg>
    </button>
  );
}
