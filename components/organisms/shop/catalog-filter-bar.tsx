"use client";

import { AnimatedTabs } from "@/components/atoms/ui/animated-tabs";
import {
  CATALOG_MENU_TAB_CUSTOM,
  CATALOG_MENU_TABS,
  catalogMenuTabLabel,
  type CatalogFilter,
} from "@/lib/shop-catalog";
import { cn } from "@/lib/utils";

const CATALOG_CATEGORY_TABS = CATALOG_MENU_TABS.filter((tab) => tab !== CATALOG_MENU_TAB_CUSTOM);

export type CatalogTabValue = CatalogFilter | typeof CATALOG_MENU_TAB_CUSTOM;

type CatalogFilterBarProps = {
  value: CatalogTabValue;
  onChange: (tab: string) => void;
};

export function CatalogFilterBar({ value, onChange }: CatalogFilterBarProps) {
  const customActive = value === CATALOG_MENU_TAB_CUSTOM;

  return (
    <div className="dingry-catalog-bar -mx-4 mb-6 border-b border-white/15 bg-[#12151c]/95 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] backdrop-blur-2xl backdrop-saturate-150 md:mb-8 md:mx-0 md:px-0">
      <AnimatedTabs
        tabs={[...CATALOG_CATEGORY_TABS]}
        value={customActive ? "" : value}
        onValueChange={onChange}
        layoutId="dingry-catalog-tabs"
        aria-label="Catégories de la collection DINGRY"
        variant="underline"
        labelForTab={catalogMenuTabLabel}
        endAction={
          <button
            type="button"
            role="tab"
            aria-selected={customActive}
            tabIndex={customActive ? 0 : -1}
            onClick={() => onChange(CATALOG_MENU_TAB_CUSTOM)}
            className={cn(
              "dingry-catalog-custom-tab shrink-0 snap-center px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.26em] transition-[border-color,box-shadow,background] duration-200 active:scale-[0.97] sm:px-5 sm:text-[11px] sm:tracking-[0.28em]",
              customActive && "dingry-catalog-custom-tab--active",
            )}
          >
            <span className="gold-text">{catalogMenuTabLabel(CATALOG_MENU_TAB_CUSTOM)}</span>
          </button>
        }
      />
    </div>
  );
}
