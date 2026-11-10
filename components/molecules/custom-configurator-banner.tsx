"use client";

import type { ShopCatalogPersoBanner } from "@/lib/admin/types";
import { DEFAULT_CATALOG_PERSO_BANNER } from "@/lib/catalog-perso-banner";

type CustomConfiguratorBannerProps = {
  onOpen: () => void;
  content?: ShopCatalogPersoBanner;
};

export function CustomConfiguratorBanner({
  onOpen,
  content = DEFAULT_CATALOG_PERSO_BANNER,
}: CustomConfiguratorBannerProps) {
  if (!content.enabled) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="dingry-custom-banner dingry-custom-banner--gift group relative mb-8 -mx-4 block w-[calc(100%+2rem)] overflow-hidden text-left md:mb-10 md:-mx-12 md:w-[calc(100%+6rem)]"
      aria-label="Ouvrir le configurateur tee personnalisé"
    >
      <span className="absolute inset-0 overflow-hidden">
        <img
          src={content.imageUrl}
          alt=""
          aria-hidden
          className="dingry-custom-banner-photo h-full w-full object-cover"
        />
      </span>
      <span className="dingry-custom-banner-veil absolute inset-0" aria-hidden />
      <span className="dingry-custom-banner-gift pointer-events-none absolute inset-0" aria-hidden>
        <span className="dingry-custom-banner-gift__ribbon-v" />
        <span className="dingry-custom-banner-gift__ribbon-h" />
        <span className="dingry-custom-banner-gift__bow" />
      </span>
      <span className="dingry-custom-banner-shine pointer-events-none absolute inset-0" aria-hidden />

      <span className="relative z-10 flex min-h-[11.5rem] flex-col justify-end px-5 py-7 sm:min-h-[13.5rem] md:min-h-[16rem] md:px-12 md:py-10 lg:min-h-[17.5rem]">
        <span className="max-w-[min(36rem,70%)]">
          <span className="dingry-typo-eyebrow block">{content.eyebrow}</span>
          <span className="dingry-custom-banner-title mt-3 block uppercase">{content.title}</span>
          <span className="dingry-typo-body-alt mt-3 block">{content.subtitle}</span>
        </span>
      </span>
    </button>
  );
}
