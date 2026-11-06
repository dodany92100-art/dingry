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
      className="dingry-custom-banner group relative mb-8 -mx-4 block w-[calc(100%+2rem)] overflow-hidden text-left md:mb-10 md:-mx-12 md:w-[calc(100%+6rem)]"
      aria-label="Ouvrir le configurateur tee personnalisé"
    >
      <span className="absolute inset-0 overflow-hidden bg-[#111]">
        <img
          src={DINGRY_PRODUCT_MEDIA.customConfiguratorBanner}
          alt=""
          aria-hidden
          className="dingry-custom-banner-photo h-full w-full object-cover"
        />
      </span>
      <span className="dingry-custom-banner-veil absolute inset-0" />

      <span className="relative z-10 flex min-h-[11.5rem] flex-col justify-end gap-6 px-5 py-7 sm:min-h-[13.5rem] sm:flex-row sm:items-end sm:justify-between md:px-12 md:py-9">
        <span className="max-w-[min(36rem,70%)]">
          <span className="dingry-typo-eyebrow block">Custom · Configurateur</span>
          <span className="dingry-custom-banner-title mt-3 block uppercase">
            Ville, texte sous le logo
          </span>
          <span className="dingry-typo-body-alt mt-3 block">
            Tee personnalisable · aperçu en direct
          </span>
        </span>
        <span className="dingry-custom-banner-cta inline-flex shrink-0 items-center border border-white/35 bg-black/30 px-6 py-3 text-[10px] tracking-[0.28em] uppercase backdrop-blur-[2px] transition-colors duration-300 group-hover:border-white/70 group-hover:bg-white/[0.08]">
          Personnaliser
        </span>
      </span>
    </button>
  );
}
