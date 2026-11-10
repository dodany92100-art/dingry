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
  /** Fond clair (catalogue) ou sombre (nav / hero). */
  tone?: "on-light" | "on-dark";
  className?: string;
};

export function WishlistIconButton({
  active,
  label,
  onClick,
  stopPropagation = false,
  size = "sm",
  tone = "on-light",
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
          ? "text-[#FF5F00] drop-shadow-[0_0_12px_rgba(255,61,0,0.28)]"
          : tone === "on-dark"
            ? "text-white/40 hover:text-white/75"
            : "text-white/35 hover:text-white/70",
        className,
      )}
    >
      <Heart
        size={iconSize}
        strokeWidth={1.5}
        className={cn(
          "shrink-0",
          active ? "fill-[#FF5F00] text-[#FF5F00]" : "fill-none",
        )}
        aria-hidden
      />
    </button>
  );
}
