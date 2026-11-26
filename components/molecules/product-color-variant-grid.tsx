"use client";

import { memo } from "react";
import { DingryProductImage } from "@/components/atoms/dingry-product-image";
import type { ShopProduct } from "@/lib/catalog";
import {
  colorSwatchPdpStyle,
  isBlackSwatchLabel,
  swatchHexForColorLabel,
} from "@/lib/storefront/color-swatch-chip";
import { pdpColorVariantChoices } from "@/lib/storefront/pdp-color-swatches";
import type { SimilarProductCard } from "@/lib/storefront/similar-products";
import styles from "./product-color-variant-grid.module.css";

type ProductColorVariantGridProps = {
  variants: SimilarProductCard[];
  onPickVariant: (product: ShopProduct) => void;
  showLabel?: boolean;
  /** PDP premium : pastilles rondes, libellé masqué sous la vignette. */
  presentation?: "default" | "pdp";
};

function ProductColorVariantGridInner({
  variants,
  onPickVariant,
  showLabel = true,
  presentation = "default",
}: ProductColorVariantGridProps) {
  const pdp = presentation === "pdp";
  const items = pdp ? pdpColorVariantChoices(variants) : variants;
  if (items.length <= 0 || (!pdp && variants.length <= 1)) return null;

  return (
    <div className={`${styles.root} ${pdp ? styles.rootPdp : ""}`}>
      {showLabel ? <p className={`${styles.label} ${pdp ? styles.labelPdp : ""}`}>Couleur</p> : null}
      <div
        className={`${styles.grid} ${pdp ? styles.gridPdp : ""}`}
        role="listbox"
        aria-label="Couleurs disponibles"
      >
        {items.map((item) => {
          const disabled = pdp
            ? false
            : item.comingSoon && !item.isActive;
          const swatchHex = pdp ? swatchHexForColorLabel(item.label) : "";
          const blackSwatch = pdp && isBlackSwatchLabel(item.label, swatchHex);
          return (
            <button
              key={item.product.id}
              type="button"
              role="option"
              aria-selected={pdp ? false : item.isActive}
              disabled={disabled}
              onClick={() => onPickVariant(item.product)}
              onPointerDown={(event) => {
                if (!pdp || event.pointerType !== "touch") return;
                event.preventDefault();
                onPickVariant(item.product);
              }}
              className={`${styles.card} ${pdp ? styles.cardPdp : ""} ${!pdp && item.isActive ? styles.cardActive : ""} ${disabled ? styles.cardDisabled : ""}`}
              title={item.label}
              aria-label={item.label}
            >
              {pdp ? (
                <span
                  className={`${styles.swatchPdp} ${blackSwatch ? styles.swatchPdpBlack : ""}`}
                  style={colorSwatchPdpStyle(item.label)}
                  aria-hidden
                />
              ) : (
                <>
                  <DingryProductImage
                    src={item.product.image}
                    alt={item.label}
                    width={80}
                    height={80}
                    deliveryWidth={160}
                    className={styles.thumb}
                  />
                  <span className={styles.caption}>
                    {item.label}
                    {item.comingSoon ? " · bientôt" : ""}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const ProductColorVariantGrid = memo(ProductColorVariantGridInner);
