"use client";

import { AnimatedTabs } from "@/components/ui/animated-tabs";
import {
  CATALOG_MENU_TAB_CUSTOM,
  CATALOG_MENU_TABS,
  catalogMenuTabLabel,
  type CatalogFilter,
} from "@/lib/shop-catalog";

export type CatalogTabValue = CatalogFilter | typeof CATALOG_MENU_TAB_CUSTOM;

type CatalogFilterBarProps = {
  value: CatalogTabValue;
  onChange: (tab: string) => void;
};

export function CatalogFilterBar({ value, onChange }: CatalogFilterBarProps) {
  return (
    <div className="dingry-catalog-bar -mx-4 mb-6 border-b border-white/15 bg-[#12151c]/95 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] backdrop-blur-2xl backdrop-saturate-150 md:mb-8 md:mx-0 md:px-0">
      <AnimatedTabs
        tabs={[...CATALOG_MENU_TABS]}
        value={value}
        onValueChange={onChange}
        layoutId="dingry-catalog-tabs"
        aria-label="Catégories de la collection DINGRY"
        variant="underline"
        labelForTab={catalogMenuTabLabel}
        classNameForTab={(tab) =>
          tab === CATALOG_MENU_TAB_CUSTOM
            ? "border border-[#0066FF]/45 bg-[#0066FF]/12 text-white hover:text-white"
            : undefined
        }
      />
    </div>
  );
}
