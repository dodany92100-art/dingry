"use client";

import { DINGRY_PRODUCT_MEDIA } from "@/lib/dingry-product-media";

type CustomConfiguratorBannerProps = {
  onOpen: () => void;
};

export function CustomConfiguratorBanner({ onOpen }: CustomConfiguratorBannerProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="dingry-custom-banner dingry-custom-banner--gift group relative mb-8 -mx-4 block w-[calc(100%+2rem)] overflow-hidden text-left md:mb-10 md:-mx-12 md:w-[calc(100%+6rem)]"
      aria-label="Ouvrir le configurateur tee personnalisé"
    >
      <span className="absolute inset-0 overflow-hidden">
        <img
          src={DINGRY_PRODUCT_MEDIA.customConfiguratorBanner}
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

      <span className="relative z-10 flex min-h-[11.5rem] flex-col justify-end gap-6 px-5 py-7 sm:min-h-[13.5rem] sm:flex-row sm:items-end sm:justify-between md:min-h-[16rem] md:px-12 md:py-10 lg:min-h-[17.5rem]">
        <span className="max-w-[min(36rem,70%)]">
          <span className="dingry-typo-eyebrow block">Custom · Configurateur</span>
          <span className="dingry-custom-banner-title mt-3 block uppercase">
            Ville, texte sous le logo
          </span>
          <span className="dingry-typo-body-alt mt-3 block">
            Tee personnalisable · aperçu en direct
          </span>
        </span>
        <span className="dingry-custom-banner-cta relative z-10 shrink-0">Personnaliser</span>
      </span>
    </button>
  );
}
