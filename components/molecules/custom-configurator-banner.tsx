"use client";

import { AnimatedTabs } from "@/components/atoms/ui/animated-tabs";
import type { ShopCatalogPersoBanner } from "@/lib/admin/types";
import {
  CUSTOM_BANNER_CITIES,
  CUSTOM_BANNER_COPY,
  resolveCustomBannerBackground,
} from "@/lib/custom-city-banner";
import { CATALOG_MENU_TAB_CUSTOM, catalogMenuTabLabel } from "@/lib/shop-catalog";
import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

const CUSTOM_BANNER_CITY_IDS = CUSTOM_BANNER_CITIES.map((city) => city.id);

function customBannerCityLabel(id: string): string {
  return CUSTOM_BANNER_CITIES.find((city) => city.id === id)?.label ?? id;
}

export type OpenCustomOptions = {
  initialLabel?: string;
};

type CustomConfiguratorBannerProps = {
  content: ShopCatalogPersoBanner;
  onOpenCustom: (options?: OpenCustomOptions) => void;
};

export function CustomConfiguratorBanner({ content, onOpenCustom }: CustomConfiguratorBannerProps) {
  const [cityId, setCityId] = useState(CUSTOM_BANNER_CITIES[0]!.id);

  const previewCity = useMemo(
    () => CUSTOM_BANNER_CITIES.find((city) => city.id === cityId) ?? CUSTOM_BANNER_CITIES[0]!,
    [cityId],
  );

  const backgroundUrl = resolveCustomBannerBackground(previewCity.background, content.imageUrl);

  const eyebrow = content.eyebrow.trim() || CUSTOM_BANNER_COPY.eyebrow;
  const onCityChange = useCallback((tab: string) => {
    setCityId(tab);
  }, []);

  if (!content.enabled) return null;

  return (
    <article
      className="dingry-custom-banner dingry-custom-banner--configurator dingry-custom-banner--bandeau group relative mb-8 w-full overflow-hidden rounded-sm text-left md:mb-10"
      aria-labelledby="dingry-custom-banner-title"
    >
      {backgroundUrl ? (
        <span className="absolute inset-0 overflow-hidden">
          <img
            src={backgroundUrl}
            alt=""
            aria-hidden
            className="dingry-custom-banner-photo h-full w-full object-cover"
          />
        </span>
      ) : null}
      <span className="dingry-custom-banner-veil absolute inset-0" aria-hidden />
      <span className="dingry-custom-banner-shine pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 flex min-h-[11.5rem] flex-col justify-end px-4 py-5 sm:min-h-[12.5rem] sm:px-6 sm:py-6 md:min-h-[14rem] md:px-8 md:py-8 lg:min-h-[15rem]">
        <header className="mb-4 max-w-lg text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.65)]">
          <p className="dingry-typo-eyebrow text-[0.62rem]">{eyebrow}</p>
          <h3 id="dingry-custom-banner-title" className="dingry-custom-banner-title mt-2 uppercase">
            {previewCity.label}
            <span className="text-white/55"> / </span>
            <span className="text-white/90">texte</span>
          </h3>
        </header>

        <div className="dingry-custom-banner-dock dingry-custom-banner-dock--catalog self-start">
          <div className="dingry-custom-banner-dock__chrome">
            <AnimatedTabs
              className="w-fit max-w-full"
              tabs={[...CUSTOM_BANNER_CITY_IDS]}
              value={cityId}
              onValueChange={onCityChange}
              layoutId="dingry-custom-banner-cities"
              aria-label={CUSTOM_BANNER_COPY.cityField}
              variant="underline"
              labelForTab={customBannerCityLabel}
              endAction={
                <button
                  type="button"
                  onClick={() => onOpenCustom({ initialLabel: previewCity.label })}
                  className={cn(
                    "dingry-catalog-custom-tab dingry-custom-banner-dock__open shrink-0 snap-center px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.26em] transition-[border-color,box-shadow,background] duration-200 active:scale-[0.97] sm:px-5 sm:text-[11px] sm:tracking-[0.28em]",
                  )}
                >
                  <span className="gold-text">{catalogMenuTabLabel(CATALOG_MENU_TAB_CUSTOM)}</span>
                </button>
              }
            />
          </div>
        </div>
      </div>
    </article>
  );
}
