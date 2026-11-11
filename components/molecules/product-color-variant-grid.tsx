"use client";

import { memo } from "react";
import { DingryProductImage } from "@/components/atoms/dingry-product-image";
import type { ShopProduct } from "@/lib/catalog";
import type { SimilarProductCard } from "@/lib/storefront/similar-products";
import styles from "./product-color-variant-grid.module.css";

type ProductColorVariantGridProps = {
  variants: SimilarProductCard[];
  onPickVariant: (product: ShopProduct) => void;
};

function ProductColorVariantGridInner({ variants, onPickVariant }: ProductColorVariantGridProps) {
  if (variants.length <= 1) return null;

  return (
    <div className={styles.root}>
      <p className={styles.label}>Couleur</p>
      <div className={styles.grid} role="listbox" aria-label="Couleurs disponibles">
        {variants.map((item) => {
          const disabled = item.comingSoon && !item.isActive;
          return (
            <button
              key={item.product.id}
              type="button"
              role="option"
              aria-selected={item.isActive}
              disabled={disabled}
              onClick={() => onPickVariant(item.product)}
              className={`${styles.card} ${item.isActive ? styles.cardActive : ""} ${disabled ? styles.cardDisabled : ""}`}
            >
              <DingryProductImage
                src={item.product.image}
                alt=""
                width={80}
                height={106}
                deliveryWidth={160}
                className={styles.thumb}
              />
              <span className={styles.caption}>
                {item.label}
                {item.comingSoon ? " · bientôt" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const ProductColorVariantGrid = memo(ProductColorVariantGridInner);
