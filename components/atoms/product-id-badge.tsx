import { memo } from "react";
import { productCatalogBadgeId } from "@/lib/product-catalog-badge-id";
import { cn } from "@/lib/utils";

type ProductIdBadgeProps = {
  id: string | number;
  className?: string;
};

function ProductIdBadgeInner({ id, className }: ProductIdBadgeProps) {
  const raw = productCatalogBadgeId(id);
  if (!raw) return null;
  const label = `#${raw}`;

  return (
    <span
      className={cn(
        "dingry-product-id-badge inline-block rounded bg-black/75 px-2 py-1 font-mono text-xs font-bold leading-none text-white shadow-sm",
        className,
      )}
      aria-hidden
    >
      {label}
    </span>
  );
}

export const ProductIdBadge = memo(ProductIdBadgeInner);
