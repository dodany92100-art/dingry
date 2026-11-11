"use client";

import { AnimatedTabs } from "@/components/atoms/ui/animated-tabs";
import type { ShopCatalogPersoBanner } from "@/lib/admin/types";
import {
  CUSTOM_BANNER_CITIES,
  CUSTOM_BANNER_COPY,
  DEFAULT_ATELIER_CONFIGURATOR_LABEL,
  resolveCustomBannerBackground,
} from "@/lib/custom-city-banner";
import {
  ATELIER_BANNER_CITY_SWITCH_ENABLED,
  DEFAULT_PERSO_BANNER_CITY_ID,
  persoBannerCityVisualForTab,
  type PersoBannerCityId,
} from "@/lib/catalog-perso-banner-cities";
import { bannerObjectPosition } from "@/lib/catalog-perso-banner-focus";
import { CATALOG_MENU_TAB_CUSTOM, catalogMenuTabLabel } from "@/lib/shop-catalog";
import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState, type CSSProperties } from "react";

const ATELIER_BANNER_CITY_TAB_IDS = CUSTOM_BANNER_CITIES.map((city) => city.id);

function atelierBannerTabLabel(tab: string): string {
  const city = CUSTOM_BANNER_CITIES.find((entry) => entry.id === tab);
  return city?.suggestion ?? tab;
}

export type OpenCustomOptions = {
  initialLabel?: string;
};

type CustomConfiguratorBannerProps = {
  content: ShopCatalogPersoBanner;
  onOpenCustom: (options?: OpenCustomOptions) => void;
};

export function CustomConfiguratorBanner({ content, onOpenCustom }: CustomConfiguratorBannerProps) {
  const fixedCityId = DEFAULT_PERSO_BANNER_CITY_ID;

  const [selectedCity, setSelectedCity] = useState(DEFAULT_ATELIER_CONFIGURATOR_LABEL);

  const activeTab =
    CUSTOM_BANNER_CITIES.find((city) => city.suggestion === selectedCity)?.id ?? fixedCityId;

  const displayCityId = ATELIER_BANNER_CITY_SWITCH_ENABLED ? activeTab : fixedCityId;

  const cityVisual = useMemo(
    () =>
      persoBannerCityVisualForTab(displayCityId as PersoBannerCityId, content.cityVisuals, {
        imageUrl: content.imageUrl,
        imageFocusX: content.imageFocusX,
        imageFocusY: content.imageFocusY,
      }),
    [content.cityVisuals, content.imageFocusX, content.imageFocusY, content.imageUrl, displayCityId],
  );

  const backgroundUrl = resolveCustomBannerBackground(cityVisual.imageUrl, content.imageUrl);

  const eyebrow = content.eyebrow.trim() || CUSTOM_BANNER_COPY.eyebrow;
  const title = content.title.trim() || CUSTOM_BANNER_COPY.title;
  const subtitle = content.subtitle.trim() || CUSTOM_BANNER_COPY.subtitle;

  const onTabChange = useCallback((tab: string) => {
    const city = CUSTOM_BANNER_CITIES.find((entry) => entry.id === tab);
    if (city) setSelectedCity(city.suggestion);
  }, []);

  const openConfigurator = useCallback(() => {
    const label = ATELIER_BANNER_CITY_SWITCH_ENABLED
      ? selectedCity
      : DEFAULT_ATELIER_CONFIGURATOR_LABEL;
    onOpenCustom({ initialLabel: label });
  }, [onOpenCustom, selectedCity]);

  if (!content.enabled) return null;

  return (
    <article
      className="dingry-custom-banner dingry-custom-banner--configurator dingry-custom-banner--bandeau group relative mb-8 w-full overflow-hidden rounded-sm text-left md:mb-10"
      aria-labelledby="dingry-custom-banner-title"
      style={
        {
          "--dingry-banner-focus-x": `${content.imageFocusX}%`,
          "--dingry-banner-focus-y": `${content.imageFocusY}%`,
        } as CSSProperties
      }
    >
      {backgroundUrl ? (
        <span className="absolute inset-0 overflow-hidden">
          <img
            src={backgroundUrl}
            alt=""
            aria-hidden
            className="dingry-custom-banner-photo h-full w-full object-cover"
            style={{
              objectPosition: bannerObjectPosition(cityVisual.imageFocusX, cityVisual.imageFocusY),
            }}
          />
        </span>
      ) : null}
      <span className="dingry-custom-banner-veil absolute inset-0" aria-hidden />
      <span className="dingry-custom-banner-shine pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 flex min-h-[11.5rem] flex-col justify-end px-4 py-5 sm:min-h-[12.5rem] sm:px-6 sm:py-6 md:min-h-[14rem] md:px-8 md:py-8 lg:min-h-[15rem]">
        <header className="mb-4 max-w-lg text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.65)]">
          <p className="dingry-typo-eyebrow text-[0.62rem]">{eyebrow}</p>
          <h3 id="dingry-custom-banner-title" className="dingry-custom-banner-title mt-2 uppercase">
            {title}
          </h3>
          <p className="dingry-typo-body-alt mt-2 text-sm text-white/88">{subtitle}</p>
        </header>

        <div className="dingry-custom-banner-dock dingry-custom-banner-dock--catalog self-start">
          <div className="dingry-custom-banner-dock__chrome">
            {ATELIER_BANNER_CITY_SWITCH_ENABLED ? (
              <AnimatedTabs
                className="w-fit max-w-full"
                tabs={[...ATELIER_BANNER_CITY_TAB_IDS]}
                value={activeTab}
                onValueChange={onTabChange}
                layoutId="dingry-custom-banner-cities"
                aria-label={CUSTOM_BANNER_COPY.cityField}
                variant="underline"
                labelForTab={atelierBannerTabLabel}
                endAction={
                  <PersonnaliserCta onClick={openConfigurator} />
                }
              />
            ) : (
              <PersonnaliserCta onClick={openConfigurator} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function PersonnaliserCta({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "dingry-catalog-custom-tab dingry-custom-banner-dock__open shrink-0 snap-center px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.26em] transition-[border-color,box-shadow,background] duration-200 active:scale-[0.97] sm:px-5 sm:text-[11px] sm:tracking-[0.28em]",
      )}
    >
      <span className="gold-text">{catalogMenuTabLabel(CATALOG_MENU_TAB_CUSTOM)}</span>
    </button>
  );
}
