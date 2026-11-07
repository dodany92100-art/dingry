"use client";

import { Heart } from "lucide-react";
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
      <Heart
        size={iconSize}
        strokeWidth={1.5}
        className="shrink-0"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.35 : 0}
        aria-hidden
      />
    </button>
  );
}
