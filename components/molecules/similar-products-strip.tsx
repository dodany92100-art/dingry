"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { DingryProductImage } from "@/components/atoms/dingry-product-image";
import type { ShopProduct } from "@/lib/catalog";
import {
  COLOR_LINE_GALLERY_LABEL,
  SIMILAR_PRODUCTS_SECTION_LABEL,
  crossSellProductCaption,
  type SimilarProductCard,
} from "@/lib/storefront/similar-products";
import styles from "./similar-products-strip.module.css";

type SimilarProductsStripProps = {
  crossSell?: ShopProduct[];
  /** Coloris du même modèle (prioritaire sur crossSell). */
  variantCards?: SimilarProductCard[];
  catalog: readonly ShopProduct[];
  onPickCrossSell: (product: ShopProduct) => void;
  tone?: "default" | "pdp-dark";
  /** Vignettes compactes sous la photo PDP (colonne gauche). */
  presentation?: "default" | "pdp-gallery";
  sectionLabel?: string;
};

function SimilarProductsStripInner({
  crossSell = [],
  variantCards,
  catalog,
  onPickCrossSell,
  tone = "default",
  presentation = "default",
  sectionLabel,
}: SimilarProductsStripProps) {
  const pdp = tone === "pdp-dark";
  const gallery = presentation === "pdp-gallery";
  const entries = variantCards
    ? variantCards.map((card) => ({
        key: card.product.id,
        product: card.product,
        caption: card.label,
        isActive: card.isActive,
      }))
    : crossSell.map((item) => ({
        key: item.id,
        product: item,
        caption: crossSellProductCaption(item, catalog),
        isActive: false,
      }));
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
  }, [entries.length, refreshScrollHints]);

  if (entries.length === 0) return null;

  const heading =
    sectionLabel ?? (gallery && variantCards ? COLOR_LINE_GALLERY_LABEL : SIMILAR_PRODUCTS_SECTION_LABEL);

  const showRightFade = scrollState.right;
  const showLeftFade = scrollState.left;

  return (
    <div
      className={`${styles.root} ${pdp ? styles.rootPdp : ""} ${gallery ? styles.rootGallery : ""}`}
    >
      <p className={`${styles.label} ${pdp ? styles.labelPdp : ""} ${gallery ? styles.labelGallery : ""}`}>
        {heading}
      </p>
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
          {entries.map((entry) => (
            <button
              key={entry.key}
              type="button"
              aria-pressed={entry.isActive}
              onClick={() => onPickCrossSell(entry.product)}
              className={`${styles.card} ${gallery ? styles.cardGallery : ""} ${entry.isActive ? styles.cardActive : ""}`}
            >
              <DingryProductImage
                src={entry.product.image}
                alt=""
                width={96}
                height={128}
                deliveryWidth={192}
                className={styles.thumb}
              />
              <span className={styles.caption}>{entry.caption}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const SimilarProductsStrip = memo(SimilarProductsStripInner);
