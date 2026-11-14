"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { OpenCustomOptions } from "@/lib/shop/atelier-open-options";
import { DINGRY_SECTION_SCROLL_OFFSET_CLASS } from "@/components/organisms/shop/catalog-layout";
import { DINGRY_ATELIER_HERO_SRC, DINGRY_LOGO_MONDE_CITIES_SRC } from "@/lib/dingry-brand";
import { useTranslation } from "@/hooks/use-translation";

type AtelierCustomSectionProps = {
  onOpenCustom: (options?: OpenCustomOptions) => void;
};

export function AtelierCustomSection({ onOpenCustom }: AtelierCustomSectionProps) {
  const { t } = useTranslation();

  useEffect(() => {
  void import("@/components/organisms/shop/personalize-modal");
  }, []);

  const eyebrow = t("atelier.sectionEyebrow");
  const title = t("atelier.sectionTitle");
  const lead = t("atelier.sectionLead");
  const cta = t("atelier.banner.cta");

  return (
    <section
      id="atelier-custom-hero"
      className={`dingry-gold-rule-top dingry-atelier-hero ${DINGRY_SECTION_SCROLL_OFFSET_CLASS} relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-hidden bg-black text-white`}
      aria-labelledby="dingry-atelier-hero-title"
    >
      <div className="relative flex min-h-[min(100dvh,56rem)] w-full flex-col justify-end">
        <AtelierHeroImage />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25"
          aria-hidden
        />
        <p className="dingry-section-eyebrow dingry-atelier-hero__eyebrow pointer-events-none absolute inset-x-0 top-12 z-30 mx-auto w-full max-w-[1400px] px-4 sm:top-14 sm:px-6 md:top-16">
          {eyebrow}
        </p>
        <div className="dingry-atelier-hero__copy relative z-20 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-10 pt-20 sm:px-6 md:pb-14 pointer-events-auto">
          <div className="dingry-atelier-hero__mark-wrap">
            <Image
              src={DINGRY_LOGO_MONDE_CITIES_SRC}
              alt={title}
              width={500}
              height={500}
              priority={false}
              className="dingry-custom-banner-mark dingry-atelier-hero__mark object-contain object-left"
            />
          </div>
          <div className="flex w-full max-w-3xl flex-col gap-4 md:gap-5">
            <AtelierHeroCta cta={cta} onOpen={() => onOpenCustom()} />
            <h2
              id="dingry-atelier-hero-title"
              className="dingry-atelier-hero__title gold-text dingry-typo-street text-[clamp(1.75rem,5vw,3.25rem)] leading-[1.05]"
            >
              {title}
            </h2>
            <p className="max-w-xl text-base text-white/90 md:text-lg">{lead}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AtelierHeroImage() {
  return (
    <div className="absolute inset-0 z-0">
      <Image
        src={DINGRY_ATELIER_HERO_SRC}
        alt=""
        aria-hidden
        priority={false}
        fill
        sizes="100vw"
        unoptimized
        className="object-cover object-[62%_50%] opacity-95"
      />
    </div>
  );
}

function AtelierHeroCta({ cta, onOpen }: { cta: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="dingry-atelier-hero__cta-dock dingry-gold-pill-btn z-20 w-fit self-start cursor-pointer rounded-full"
    >
      <span className="gold-text">{cta}</span>
    </button>
  );
}
