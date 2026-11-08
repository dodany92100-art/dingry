"use client";

import { AnimatedTabs } from "@/components/atoms/ui/animated-tabs";
import { HoverBorderGradient } from "@/components/atoms/ui/hover-border-gradient";
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
          <HoverBorderGradient
            as="button"
            type="button"
            role="tab"
            aria-selected={customActive}
            tabIndex={customActive ? 0 : -1}
            onClick={() => onChange(CATALOG_MENU_TAB_CUSTOM)}
            containerClassName={cn(
              "shrink-0 snap-center rounded-sm",
              customActive && "shadow-[0_0_18px_rgba(0,102,255,0.4)]",
            )}
            className={cn(
              "px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.26em] sm:px-5 sm:text-[11px] sm:tracking-[0.28em]",
              customActive ? "text-white" : "text-white/75",
            )}
          >
            {catalogMenuTabLabel(CATALOG_MENU_TAB_CUSTOM)}
          </HoverBorderGradient>
        }
      />
    </div>
  );
}
