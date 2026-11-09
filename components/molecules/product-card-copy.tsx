"use client";

import { memo } from "react";
import { ProductCardPrice } from "@/components/atoms/product-card-price";

type ProductCardCopyProps = {
  name: string;
  variant: string;
  price: number;
};

function ProductCardCopyInner({ name, variant, price }: ProductCardCopyProps) {
  return (
    <div className="dingry-product-card__info shrink-0 p-2 text-left">
      <p className="dingry-product-ref dingry-product-ref--title line-clamp-2">{name}</p>
      <div className="dingry-product-card__footer mt-1 flex items-center justify-between gap-2 pt-1 sm:mt-1.5 sm:pt-1.5">
        <span className="dingry-product-ref dingry-product-ref--variant min-w-0 flex-1 line-clamp-1">
          {variant || "\u00a0"}
        </span>
        <ProductCardPrice amount={price} />
      </div>
    </div>
  );
}

export const ProductCardCopy = memo(ProductCardCopyInner);
