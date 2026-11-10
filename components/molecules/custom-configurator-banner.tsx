"use client";

import type { ShopCatalogPersoBanner } from "@/lib/admin/types";
import {
  CUSTOM_BANNER_CITIES,
  CUSTOM_BANNER_COPY,
  resolveCustomBannerBackground,
} from "@/lib/custom-city-banner";
import { useMemo, useState } from "react";

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
  const title = content.title.trim() || CUSTOM_BANNER_COPY.title;
  const subtitle = content.subtitle.trim() || CUSTOM_BANNER_COPY.subtitle;
  const ctaLabel = content.ctaLabel.trim() || CUSTOM_BANNER_COPY.cta;

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
            {title}
          </h3>
          <p className="dingry-typo-body-alt mt-2 hidden text-sm sm:block">{subtitle}</p>
        </header>

        <div className="dingry-custom-banner-dock flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <span className="dingry-custom-banner-dock__tab inline-flex shrink-0 items-center self-start rounded-sm bg-[rgb(191_149_63/0.92)] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-black">
            Custom
          </span>

          <div
            className="dingry-custom-banner-dock__cities flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={CUSTOM_BANNER_COPY.cityField}
          >
            {CUSTOM_BANNER_CITIES.map((city) => {
              const active = city.id === cityId;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => setCityId(city.id)}
                  className={`shrink-0 rounded-sm border px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] backdrop-blur-md transition ${
                    active
                      ? "border-white/55 bg-white/22 text-white"
                      : "border-white/18 bg-black/30 text-white/80 hover:border-white/35"
                  }`}
                >
                  {city.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onOpenCustom({ initialLabel: previewCity.label })}
            className="dingry-custom-banner-cta dingry-custom-banner-dock__cta dingry-gold-pill-btn dingry-hover-border-fill shrink-0 sm:min-w-[10.5rem]"
          >
            <span className="gold-text">{ctaLabel}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
