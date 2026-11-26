"use client";

import { AnimatedTabs } from "@/components/atoms/ui/animated-tabs";
import {
  CATALOG_BRAND_FILTER_VALUES,
  catalogBrandFilterLabel,
  type CatalogBrandFilter,
} from "@/lib/catalog-brand";
import { useTranslation } from "@/hooks/use-translation";

type CatalogBrandBarProps = {
  value: CatalogBrandFilter;
  onChange: (brand: CatalogBrandFilter) => void;
};

const BRAND_TAB_KEYS = CATALOG_BRAND_FILTER_VALUES.flatMap((brand) => (brand ? [brand] : []));

function tabKeyToBrand(key: string): CatalogBrandFilter {
  return key as CatalogBrandFilter;
}

export function CatalogBrandBar({ value, onChange }: CatalogBrandBarProps) {
  const { t } = useTranslation();
  const tabValue = value ?? "all";

  return (
    <div className="dingry-catalog-brand-bar dingry-catalog-brand-bar--gold-frame dingry-catalog-bar--silver mb-3 w-max max-w-full border-b border-white/10 pb-2.5 md:mb-4">
      <p className="dingry-section-eyebrow mb-2 text-[9px] tracking-[0.2em] text-white/45">
        {t("catalog.brandEyebrow")}
      </p>
      <AnimatedTabs
        className="dingry-catalog-brand-tabs-scroll"
        tabs={BRAND_TAB_KEYS}
        value={tabValue}
        onValueChange={(next) => onChange(tabKeyToBrand(next))}
        layoutId="dingry-catalog-brand-tabs"
        aria-label={t("catalog.brandFiltersAria")}
        variant="underline"
        scrollActiveIntoView={false}
        labelForTab={(tab) => catalogBrandFilterLabel(tabKeyToBrand(tab))}
      />
    </div>
  );
}