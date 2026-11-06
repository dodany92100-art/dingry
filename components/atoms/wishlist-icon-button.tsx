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
  const dim = size === "md" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = size === "md" ? 22 : 18;

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
        "dingry-interactive-luxe flex items-center justify-center rounded-full border backdrop-blur-md transition-colors duration-200",
        dim,
        active
          ? "border-[#0066FF]/70 bg-black/50 text-[#7EB3FF] hover:border-[#0066FF] hover:bg-black/65"
          : "border-white/20 bg-black/45 text-white/80 hover:border-white/45 hover:bg-black/60 hover:text-white",
        className,
      )}
    >
      <Heart
        size={iconSize}
        strokeWidth={1.65}
        className="shrink-0"
        fill={active ? "currentColor" : "none"}
        aria-hidden
      />
    </button>
  );
}
