import { cn } from "@/lib/utils";

type CatalogSoldOutBadgeProps = {
  className?: string;
};

export function CatalogSoldOutBadge({ className }: CatalogSoldOutBadgeProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "dingry-catalog-sold-out-badge pointer-events-none absolute left-2 z-[15] rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] shadow-sm sm:left-2.5 sm:px-2.5 sm:py-1 sm:text-[11px]",
        className,
      )}
    >
      Épuisé
    </span>
  );
}