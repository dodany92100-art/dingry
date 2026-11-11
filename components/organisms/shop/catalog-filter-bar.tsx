"use client";

import { AnimatedTabs } from "@/components/atoms/ui/animated-tabs";
import {
  CATALOG_MENU_TAB_CUSTOM,
  CATALOG_MENU_TABS,
  catalogMenuTabLabel,
  type CatalogFilter,
} from "@/lib/shop-catalog";
const CATALOG_CATEGORY_TABS = CATALOG_MENU_TABS.filter((tab) => tab !== CATALOG_MENU_TAB_CUSTOM);

export type CatalogTabValue = CatalogFilter | typeof CATALOG_MENU_TAB_CUSTOM;

type CatalogFilterBarProps = {
  value: CatalogTabValue;
  onChange: (tab: string) => void;
};

export function CatalogFilterBar({ value, onChange }: CatalogFilterBarProps) {
  const categoryValue = value === CATALOG_MENU_TAB_CUSTOM ? CATALOG_CATEGORY_TABS[0]! : value;

  return (
    <div className="dingry-catalog-bar dingry-catalog-bar--silver dingry-catalog-bar--vitrine mb-6 w-full md:mb-8">
      <div className="dingry-catalog-bar__chrome py-2.5 md:py-3">
      <AnimatedTabs
        tabs={[...CATALOG_CATEGORY_TABS]}
        value={categoryValue}
        onValueChange={onChange}
        layoutId="dingry-catalog-tabs"
        aria-label="Catégories de la collection DINGRY"
        variant="underline"
        labelForTab={catalogMenuTabLabel}
      />
      </div>
    </div>
  );
}
