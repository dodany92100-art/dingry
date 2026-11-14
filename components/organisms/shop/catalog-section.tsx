"use client";

import { memo } from "react";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import type { ShopProduct } from "@/lib/catalog";
import type { FlipPair } from "@/lib/shop-view";
import { CATALOG_VITRINE_SHELL_CLASS, CATALOG_SECTION_SURFACE_CLASS } from "./catalog-layout";
import { CatalogFilterBar, type CatalogTabValue } from "./catalog-filter-bar";
import { CatalogGrid } from "./catalog-grid";
import type { CatalogState } from "./hooks/use-shop-catalog";
import { useTranslation } from "@/hooks/use-translation";

type CatalogSectionProps = {
  tabValue: CatalogTabValue;
  onTabChange: (tab: string) => void;
  catalogState: CatalogState;
  onRetry: () => void;
  filterKey: string;
  products: ShopProduct[];
  flipPairs: FlipPair[];
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  wishlistIds: readonly number[];
  onToggleWishlist: (rectoId: number) => void;
  showAdminIdBadge?: boolean;
};

function CatalogSectionInner({ tabValue, onTabChange, ...grid }: CatalogSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="catalogue" className={CATALOG_SECTION_SURFACE_CLASS}>
      <div className={CATALOG_VITRINE_SHELL_CLASS}>
        <CatalogFilterBar value={tabValue} onChange={onTabChange} products={grid.products} />

        {grid.catalogState === "error" ? (
          <div
            className="mb-6 border border-amber-500/35 bg-amber-950/30 px-4 py-3 text-sm leading-relaxed text-amber-100/90"
            role="status"
          >
            {t("catalog.unavailable")}
          </div>
        ) : null}

        <CatalogGrid {...grid} />
      </div>
    </section>
  );
}

export const CatalogSection = memo(CatalogSectionInner);
