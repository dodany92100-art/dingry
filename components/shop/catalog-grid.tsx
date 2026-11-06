"use client";

import { motion } from "motion/react";
import type { ProductFlipSide } from "@/components/product-image-flip";
import { ProductCard } from "@/components/product-card";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { catalogBackImageForRecto, type FlipPair } from "@/lib/shop-view";
import type { CatalogState } from "./hooks/use-shop-catalog";
import { MODAL_OVERLAY_EASE } from "./motion";

type CatalogGridProps = {
  catalogState: CatalogState;
  onRetry: () => void;
  /** Clé d'animation : change avec le filtre actif. */
  filterKey: string;
  products: ShopProduct[];
  flipPairs: FlipPair[];
  swipeHintIndex: number;
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
};

export function CatalogGrid({
  catalogState,
  onRetry,
  filterKey,
  products,
  flipPairs,
  swipeHintIndex,
  onOpenProduct,
}: CatalogGridProps) {
  if (catalogState === "error") {
    return (
      <div className="mb-10 border border-white/15 bg-[#0a0a0a]/80 px-6 py-8 text-center md:px-10">
        <p className="text-sm leading-relaxed text-white/60">
          Impossible de charger Dingry collection pour le moment.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 border border-white/20 px-6 py-3 text-[10px] tracking-[0.22em] text-white uppercase transition-colors hover:border-[#0066FF] hover:text-[#7EB3FF]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div
      key={filterKey}
      initial={{ opacity: 0.5, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: MODAL_OVERLAY_EASE }}
      className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
    >
      {products.length > 0 ? (
        products.map((product, index) => (
          <ProductCard
            key={product.id}
            name={storefrontProductTitle(product)}
            variant={storefrontProductSubtitle(product)}
            image={product.image}
            backImage={catalogBackImageForRecto(product, flipPairs)}
            swipeHint={index === swipeHintIndex && swipeHintIndex >= 0}
            price={product.price}
            priority={index < 4}
            soldOut={!isShopProductInStock(product)}
            onClick={(side) => onOpenProduct(product, side)}
          />
        ))
      ) : (
        <div className="col-span-full border border-white/[0.06] py-20 text-center">
          <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase mb-4">Bientôt disponible</p>
          <p className="text-sm text-white/40 tracking-wider">
            Cette catégorie sera bientôt disponible dans Dingry collection.
          </p>
        </div>
      )}
    </motion.div>
  );
}
