"use client";

import { memo } from "react";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import type { ShopProduct } from "@/lib/catalog";
import type { FlipPair } from "@/lib/shop-view";
import {
  CATALOG_PRODUCT_GRID_CLASS,
  CATALOG_SCROLL_OFFSET_CLASS,
  CATALOG_SECTION_HEADING_CLASS,
  CATALOG_SECTION_SURFACE_CLASS,
  CATALOG_VITRINE_SHELL_CLASS,
} from "./catalog-layout";
import type { CatalogBrandFilter } from "@/lib/catalog-brand";
import { CatalogFilterBar, type CatalogTabValue } from "./catalog-filter-bar";
import { CatalogBrandBar } from "./catalog-brand-bar";
import { CatalogGrid } from "./catalog-grid";
import { CatalogProductCell } from "./catalog-product-cell";
import { catalogRectoId } from "@/lib/dingry-product-display";
import type { CatalogState } from "./hooks/use-shop-catalog";
import { useTranslation } from "@/hooks/use-translation";
import type { AtelierModelPickerGroupId } from "@/lib/atelier-custom-config";

type CatalogSectionProps = {
  tabValue: CatalogTabValue;
  onTabChange: (tab: string) => void;
  brandValue: CatalogBrandFilter;
  onBrandChange: (brand: CatalogBrandFilter) => void;
  catalogState: CatalogState;
  onRetry: () => void;
  filterKey: string;
  products: ShopProduct[];
  flipPairs: FlipPair[];
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  wishlistIds: readonly number[];
  onToggleWishlist: (rectoId: number) => void;
  showAdminIdBadge?: boolean;
  atelierEnabled?: boolean;
  onOpenAtelierFromCategory?: (group: AtelierModelPickerGroupId) => void;
  /** Collection DINGRY MADA (onglet marque DINGRY uniquement). */
  dingryMadaProducts?: readonly ShopProduct[];
};

function CatalogSectionInner({
  tabValue,
  onTabChange,
  brandValue,
  onBrandChange,
  atelierEnabled,
  onOpenAtelierFromCategory,
  dingryMadaProducts,
  ...grid
}: CatalogSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="catalogue" className={`${CATALOG_SECTION_SURFACE_CLASS} ${CATALOG_SCROLL_OFFSET_CLASS}`}>
      <div className={CATALOG_VITRINE_SHELL_CLASS}>
        <CatalogFilterBar value={tabValue} onChange={onTabChange} products={grid.products} />
        <CatalogBrandBar value={brandValue} onChange={onBrandChange} />

        {grid.catalogState === "error" ? (
          <div
            className="mb-6 border border-amber-500/35 bg-amber-950/30 px-4 py-3 text-sm leading-relaxed text-amber-100/90"
            role="status"
          >
            {t("catalog.unavailable")}
          </div>
        ) : null}

        <CatalogGrid
          {...grid}
          atelierEnabled={atelierEnabled}
          onOpenAtelierFromCategory={onOpenAtelierFromCategory}
        />

        {dingryMadaProducts && dingryMadaProducts.length > 0 ? (
          <div
            id="catalog-dingry-mada"
            className="dingry-gold-rule-top mt-12 space-y-4 border-white/10 pt-8 md:mt-16 md:space-y-5 md:pt-10"
          >
            <p className="dingry-section-eyebrow dingry-catalog-collection-eyebrow m-0">
              {t("brandPages.madaProductsHeading")}
            </p>
            <h3 className={`${CATALOG_SECTION_HEADING_CLASS} m-0`}>DINGRY MADA</h3>
            <p className="m-0 max-w-2xl text-base leading-relaxed md:text-lg">{t("brandPages.dingry.madaLead")}</p>
            <div
              className={CATALOG_PRODUCT_GRID_CLASS}
              aria-label={t("brandPages.madaProductsHeading")}
            >
              {dingryMadaProducts.map((product, index) => {
                const rectoId = catalogRectoId(product.id);
                return (
                  <CatalogProductCell
                    key={product.id}
                    product={product}
                    catalog={dingryMadaProducts}
                    globalIndex={index}
                    wishlistActive={grid.wishlistIds.includes(rectoId)}
                    onOpenProduct={grid.onOpenProduct}
                    onToggleWishlist={grid.onToggleWishlist}
                    showAdminIdBadge={grid.showAdminIdBadge}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export const CatalogSection = memo(CatalogSectionInner);
