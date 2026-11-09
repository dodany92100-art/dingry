"use client";

import { memo } from "react";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import type { ShopProduct } from "@/lib/catalog";
import type { FlipPair } from "@/lib/shop-view";
import { CustomConfiguratorBanner } from "@/components/molecules/custom-configurator-banner";
import { CATALOG_SECTION_SURFACE_CLASS } from "./catalog-layout";
import { CatalogFilterBar, type CatalogTabValue } from "./catalog-filter-bar";
import { CatalogGrid } from "./catalog-grid";
import type { CatalogState } from "./hooks/use-shop-catalog";
import type { ShopCatalogPersoBanner } from "@/lib/admin/types";

type CatalogSectionProps = {
  tabValue: CatalogTabValue;
  onTabChange: (tab: string) => void;
  onOpenCustom: () => void;
  catalogState: CatalogState;
  onRetry: () => void;
  filterKey: string;
  products: ShopProduct[];
  flipPairs: FlipPair[];
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  wishlistIds: readonly number[];
  onToggleWishlist: (rectoId: number) => void;
  persoBanner: ShopCatalogPersoBanner;
};

function CatalogSectionInner({
  tabValue,
  onTabChange,
  onOpenCustom,
  persoBanner,
  ...grid
}: CatalogSectionProps) {
  return (
    <section id="catalogue" className={CATALOG_SECTION_SURFACE_CLASS}>
      <div className="mb-4 md:mb-5">
        <h2 className="mb-2">
          <DingryLogo animate={false} className="dingry-catalog-logo h-9 md:h-14" />
        </h2>
      </div>

      <CatalogFilterBar value={tabValue} onChange={onTabChange} />

      {grid.catalogState === "error" ? (
        <div
          className="mb-6 border border-amber-500/35 bg-amber-950/30 px-4 py-3 text-sm leading-relaxed text-amber-100/90"
          role="status"
        >
          Catalogue momentanément indisponible — achat désactivé. Réessayez dans un instant.
        </div>
      ) : null}

      <CustomConfiguratorBanner onOpen={onOpenCustom} content={persoBanner} />

      <CatalogGrid {...grid} />
    </section>
  );
}

export const CatalogSection = memo(CatalogSectionInner);
