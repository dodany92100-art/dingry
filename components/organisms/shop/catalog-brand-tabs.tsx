"use client";

import { AnimatedTabs } from "@/components/atoms/ui/animated-tabs";
import {
  CATALOG_BRAND_FILTER_VALUES,
  catalogBrandFilterLabel,
  type CatalogBrandFilter,
} from "@/lib/catalog-brand";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

const BRAND_TAB_KEYS = CATALOG_BRAND_FILTER_VALUES.flatMap((brand) => (brand ? [brand] : []));

function tabKeyToBrand(key: string): CatalogBrandFilter {
  return key as CatalogBrandFilter;
}

export type CatalogBrandTabsProps = {
  value: CatalogBrandFilter;
  onChange: (brand: CatalogBrandFilter) => void;
  className?: string;
  layoutId?: string;
  scrollActiveIntoView?: boolean;
  /** `nav` = même ligne / typo que Collection · Atelier · Lookbook */
  placement?: "nav" | "menu";
  /** Une seule règle dorée : surligner la marque seulement quand le catalogue est la section active. */
  showNavActiveRule?: boolean;
};

/** Onglets marque DINGRY · ROCK THE STREET · FYMA (barre principale). */
export function CatalogBrandTabs({
  value,
  onChange,
  className,
  layoutId = "dingry-catalog-brand-tabs",
  scrollActiveIntoView = false,
  placement = "nav",
  showNavActiveRule = true,
}: CatalogBrandTabsProps) {
  const { t } = useTranslation();
  const tabValue = value ?? "all";
  const inNav = placement === "nav";

  return (
    <AnimatedTabs
      className={cn(
        "dingry-catalog-brand-tabs-scroll",
        inNav && "dingry-nav-brand-tabs--inline",
        inNav && showNavActiveRule && "dingry-nav-brand-tabs--show-rule",
        className,
      )}
      tabs={BRAND_TAB_KEYS}
      value={tabValue}
      onValueChange={(next) => onChange(tabKeyToBrand(next))}
      layoutId={layoutId}
      aria-label={t("catalog.brandFiltersAria")}
      variant="underline"
      scrollActiveIntoView={scrollActiveIntoView}
      labelForTab={(tab) => catalogBrandFilterLabel(tabKeyToBrand(tab))}
      classNameForTab={() =>
        inNav
          ? "dingry-nav-menu-link dingry-interactive-luxe relative min-h-10 shrink-0 px-1 text-[11px] tracking-[0.14em] text-white/45 uppercase hover:text-white lg:min-h-11 lg:px-1.5 lg:text-xs lg:tracking-[0.18em]"
          : "dingry-nav-brand-tab shrink-0 px-2 py-1 text-[9px] font-medium tracking-[0.14em] text-white/55 uppercase lg:px-2.5 lg:text-[10px] lg:tracking-[0.16em]"
      }
    />
  );
}