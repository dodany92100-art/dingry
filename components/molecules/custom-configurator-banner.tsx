"use client";

import { AnimatedTabs } from "@/components/atoms/ui/animated-tabs";
import type { ShopCatalogPersoBanner } from "@/lib/admin/types";
import {
  CUSTOM_BANNER_CITIES,
  DEFAULT_ATELIER_CONFIGURATOR_LABEL,
  formatPersoBannerSubtitle,
  resolveCustomBannerBackground,
} from "@/lib/custom-city-banner";
import { useTranslation } from "@/hooks/use-translation";
import {
  ATELIER_BANNER_CITY_SWITCH_ENABLED,
  DEFAULT_PERSO_BANNER_CITY_ID,
  persoBannerCityVisualForTab,
  type PersoBannerCityId,
} from "@/lib/catalog-perso-banner-cities";
import { bannerObjectPosition } from "@/lib/catalog-perso-banner-focus";
import { DINGRY_LOGO_MONDE_CITIES_SRC } from "@/lib/dingry-brand";
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
  const { t } = useTranslation();
  const bannerCopy = {
    eyebrow: t("atelier.banner.eyebrow"),
    title: t("atelier.banner.title"),
    subtitle: t("atelier.banner.subtitle"),
    cityField: t("atelier.banner.cityField"),
    citySearchPlaceholder: t("atelier.banner.citySearchPlaceholder"),
    cta: t("atelier.banner.cta"),
  };
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

  const eyebrow = content.eyebrow.trim() || bannerCopy.eyebrow;
  const title = content.title.trim() || bannerCopy.title;
  const subtitle = formatPersoBannerSubtitle(content.subtitle.trim() || bannerCopy.subtitle);

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
      className="dingry-custom-banner dingry-custom-banner--configurator dingry-custom-banner--bandeau group relative mx-auto h-[clamp(15rem,28vw,23.75rem)] w-full max-w-5xl max-h-[380px] overflow-hidden rounded-2xl text-left shadow-[0_12px_40px_rgb(0_0_0/0.22)]"
      aria-labelledby="dingry-custom-banner-title"
      style={
        {
          "--dingry-banner-focus-x": `${content.imageFocusX}%`,
          "--dingry-banner-focus-y": `${content.imageFocusY}%`,
        } as CSSProperties
      }
    >
      {backgroundUrl ? (
        <span className="absolute inset-0 block overflow-hidden">
          <img
            src={backgroundUrl}
            alt=""
            aria-hidden
            className="dingry-custom-banner-photo h-full min-h-full w-full object-cover"
            style={{
              objectPosition: bannerObjectPosition(cityVisual.imageFocusX, cityVisual.imageFocusY),
            }}
          />
        </span>
      ) : null}
      <span className="dingry-custom-banner-veil absolute inset-0" aria-hidden />
      <span className="dingry-custom-banner-shine pointer-events-none absolute inset-0" aria-hidden />

      <div className="dingry-custom-banner__stack relative z-10 flex h-full flex-col justify-between gap-0 px-4 pb-2 pt-0 sm:px-6 sm:pb-2.5 md:px-7 md:pb-3">
        <header className="max-w-xl text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.65)]">
          <p className="dingry-custom-banner-eyebrow dingry-typo-eyebrow">{eyebrow}</p>
          <img
            src={DINGRY_LOGO_MONDE_CITIES_SRC}
            alt={title}
            width={500}
            height={500}
            decoding="async"
            className="dingry-custom-banner-mark h-[clamp(6.25rem,24vw,11rem)] w-auto max-w-[min(100%,28rem)] object-contain object-left"
          />
          <h3
            id="dingry-custom-banner-title"
            className="dingry-custom-banner-headline dingry-typo-street"
          >
            {subtitle}
          </h3>
        </header>

        <div className="dingry-custom-banner-dock dingry-custom-banner-dock--catalog mt-auto self-start">
          {ATELIER_BANNER_CITY_SWITCH_ENABLED ? (
            <div className="dingry-custom-banner-dock__chrome">
              <AnimatedTabs
                className="w-fit max-w-full"
                tabs={[...ATELIER_BANNER_CITY_TAB_IDS]}
                value={activeTab}
                onValueChange={onTabChange}
                layoutId="dingry-custom-banner-cities"
                aria-label={bannerCopy.cityField}
                variant="underline"
                labelForTab={atelierBannerTabLabel}
                endAction={<PersonnaliserCta onClick={openConfigurator} />}
              />
            </div>
          ) : (
            <PersonnaliserCta onClick={openConfigurator} />
          )}
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
        "dingry-heritage-teaser-cta shrink-0 snap-center px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] transition-[border-color,box-shadow,background,transform] duration-200 active:scale-[0.97] sm:px-7 sm:text-[11px] sm:tracking-[0.3em]",
        ATELIER_BANNER_CITY_SWITCH_ENABLED &&
          "dingry-catalog-custom-tab dingry-custom-banner-dock__open",
      )}
    >
      <span className="gold-text">{catalogMenuTabLabel(CATALOG_MENU_TAB_CUSTOM)}</span>
    </button>
  );
}
