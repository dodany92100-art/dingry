"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import { ProductCard } from "@/components/molecules/product-card";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { buildCatalogMenuSections } from "@/lib/shop-catalog";
import { catalogBackImageForRecto, type FlipPair } from "@/lib/shop-view";
import type { CatalogState } from "./hooks/use-shop-catalog";
import { CollectionFeed } from "./collection-feed";
import { CATALOG_PRODUCT_GRID_CLASS } from "./catalog-layout";
import { MODAL_OVERLAY_EASE } from "./motion";

const GRID_CLASS = CATALOG_PRODUCT_GRID_CLASS;

type CatalogGridProps = {
  catalogState: CatalogState;
  onRetry: () => void;
  /** Clé d'animation : change avec le filtre actif. */
  filterKey: string;
  products: ShopProduct[];
  flipPairs: FlipPair[];
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
};

function buildProductCells(
  products: ShopProduct[],
  flipPairs: FlipPair[],
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void,
  catalogPeekResetKey: string,
  indexOffset = 0,
): ReactNode[] {
  return products.map((product, index) => {
    const globalIndex = indexOffset + index;
    return (
      <ProductCard
        key={product.id}
        name={storefrontProductTitle(product)}
        variant={storefrontProductSubtitle(product)}
        image={product.image}
        backImage={catalogBackImageForRecto(product, flipPairs)}
        isFirstInGrid={globalIndex === 0}
        isFirstProduct={globalIndex === 0}
        peekResetKey={catalogPeekResetKey}
        price={product.price}
        priority={globalIndex < 4}
        soldOut={!isShopProductInStock(product)}
        onClick={(side) => onOpenProduct(product, side)}
      />
    );
  });
}

function EmptyCategory() {
  return (
    <div className="col-span-full border border-white/[0.06] py-20 text-center">
      <p className="mb-4 text-[10px] tracking-[0.35em] text-[#0066FF] uppercase">Bientôt disponible</p>
      <p className="text-sm tracking-wider text-white/40">
        Cette catégorie sera bientôt disponible dans Dingry collection.
      </p>
    </div>
  );
}

export function CatalogGrid({
  catalogState,
  onRetry,
  filterKey,
  products,
  flipPairs,
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

  const isCollectionFeed = filterKey === "all";
  const sections = isCollectionFeed ? buildCatalogMenuSections(products) : null;

  if (isCollectionFeed && sections) {
    return (
      <motion.div
        key={filterKey}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, ease: MODAL_OVERLAY_EASE }}
      >
        {sections.length === 0 ? (
          <div className={GRID_CLASS}>
            <EmptyCategory />
          </div>
        ) : (
          <CollectionFeed
            sections={sections}
            flipPairs={flipPairs}
            peekResetKey={filterKey}
            onOpenProduct={onOpenProduct}
          />
        )}
      </motion.div>
    );
  }

  const cells = buildProductCells(products, flipPairs, onOpenProduct, filterKey);

  return (
    <motion.div
      key={filterKey}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: MODAL_OVERLAY_EASE }}
      className={GRID_CLASS}
    >
      {products.length > 0 ? cells : <EmptyCategory />}
    </motion.div>
  );
}
