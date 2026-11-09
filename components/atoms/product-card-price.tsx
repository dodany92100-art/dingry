"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

const priceFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type ProductCardPriceProps = {
  amount: number;
  className?: string;
};

function ProductCardPriceInner({ amount, className }: ProductCardPriceProps) {
  return (
    <span
      className={cn(
        "dingry-product-price dingry-product-price--sm shrink-0 tabular-nums",
        className,
      )}
    >
      {priceFormat.format(amount)}
    </span>
  );
}

export const ProductCardPrice = memo(ProductCardPriceInner);
