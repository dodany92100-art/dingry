"use client";

import { memo } from "react";
import { DingryProductImage } from "@/components/atoms/dingry-product-image";
import type { ShopProduct } from "@/lib/catalog";
import {
  SIMILAR_PRODUCTS_SECTION_LABEL,
  crossSellProductCaption,
  type SimilarProductCard,
} from "@/lib/storefront/similar-products";
import styles from "./similar-products-strip.module.css";

type SimilarProductsStripProps = {
  variants: SimilarProductCard[];
  crossSell: ShopProduct[];
  catalog: readonly ShopProduct[];
  onPickVariant: (product: ShopProduct) => void;
  onPickCrossSell: (product: ShopProduct) => void;
};

function SimilarProductsStripInner({
  variants,
  crossSell,
  catalog,
  onPickVariant,
  onPickCrossSell,
}: SimilarProductsStripProps) {
  if (variants.length === 0 && crossSell.length === 0) return null;

  return (
    <div className={styles.root}>
      <p className={styles.label}>{SIMILAR_PRODUCTS_SECTION_LABEL}</p>
      <div className={styles.row}>
        {variants.length > 0
          ? variants.map((item) => (
              <button
                key={item.product.id}
                type="button"
                disabled={item.comingSoon}
                onClick={() => onPickVariant(item.product)}
                className={`${styles.card} ${item.comingSoon ? styles.cardDisabled : ""}`}
              >
                <DingryProductImage
                  src={item.product.image}
                  alt=""
                  width={96}
                  height={128}
                  deliveryWidth={192}
                  className={styles.thumb}
                />
                <span className={styles.caption}>
                  {item.label}
                  {item.comingSoon ? " · bientôt" : ""}
                </span>
              </button>
            ))
          : crossSell.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onPickCrossSell(product)}
                className={styles.card}
              >
                <DingryProductImage
                  src={product.image}
                  alt=""
                  width={96}
                  height={128}
                  deliveryWidth={192}
                  className={styles.thumb}
                />
                <span className={styles.caption}>{crossSellProductCaption(product, catalog)}</span>
              </button>
            ))}
      </div>
    </div>
  );
}

export const SimilarProductsStrip = memo(SimilarProductsStripInner);
