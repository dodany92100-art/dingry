"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
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
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ left: false, right: false });

  const refreshScrollHints = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const { scrollLeft, scrollWidth, clientWidth } = row;
  const maxScroll = scrollWidth - clientWidth;
    setScrollState({
      left: scrollLeft > 4,
      right: maxScroll > 4 && scrollLeft < maxScroll - 4,
    });
  }, []);

  useEffect(() => {
    refreshScrollHints();
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(refreshScrollHints);
    ro.observe(row);
    return () => ro.disconnect();
  }, [variants, crossSell, refreshScrollHints]);

  if (variants.length === 0 && crossSell.length === 0) return null;

  const showRightFade = scrollState.right;
  const showLeftFade = scrollState.left;

  return (
    <div className={styles.root}>
      <p className={styles.label}>{SIMILAR_PRODUCTS_SECTION_LABEL}</p>
      <div
        className={`${styles.rowOuter} ${showRightFade ? styles.rowOuterScrollable : ""} ${showLeftFade ? styles.rowOuterScrolled : ""}`}
      >
        {showRightFade ? (
          <span className={styles.scrollCue} aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        ) : null}
        <div ref={rowRef} className={styles.row} onScroll={refreshScrollHints}>
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
    </div>
  );
}

export const SimilarProductsStrip = memo(SimilarProductsStripInner);
