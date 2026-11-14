"use client";

import { AnimatedTabs } from "@/components/atoms/ui/animated-tabs";
import {
  CATALOG_MENU_TAB_CUSTOM,
  catalogMenuTabsForStorefront,
  type CatalogFilter,
} from "@/lib/shop-catalog";
import type { ShopProduct } from "@/lib/catalog";
import { useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";

export type CatalogTabValue = CatalogFilter | typeof CATALOG_MENU_TAB_CUSTOM;

type CatalogFilterBarProps = {
  value: CatalogTabValue;
  onChange: (tab: string) => void;
  products: readonly ShopProduct[];
};

export function CatalogFilterBar({ value, onChange, products }: CatalogFilterBarProps) {
  const { t, catalogTabLabel } = useTranslation();
  const categoryTabs = useMemo(
    () => catalogMenuTabsForStorefront(products).filter((tab) => tab !== CATALOG_MENU_TAB_CUSTOM),
    [products],
  );
  const categoryValue = value === CATALOG_MENU_TAB_CUSTOM ? categoryTabs[0] ?? "all" : value;

  return (
    <div className="dingry-catalog-bar dingry-catalog-bar--silver dingry-catalog-bar--vitrine dingry-catalog-bar--mobile-bleed -mt-px mb-4 w-full md:mb-6">
      <div className="dingry-catalog-bar__chrome py-2.5 md:py-3">
      <AnimatedTabs
        className="dingry-catalog-tabs-scroll"
        tabs={[...categoryTabs]}
        value={categoryValue}
        onValueChange={onChange}
        layoutId="dingry-catalog-tabs"
        aria-label={t("catalog.filtersAria")}
        variant="underline"
        labelForTab={catalogTabLabel}
      />
      </div>
    </div>
  );
}
