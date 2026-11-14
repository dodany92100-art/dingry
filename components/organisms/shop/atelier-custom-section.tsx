"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { OpenCustomOptions } from "@/lib/shop/atelier-open-options";
import { DINGRY_ATELIER_HERO_SRC } from "@/lib/dingry-brand";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
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
      className="dingry-gold-rule-top dingry-atelier-hero scroll-mt-28 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-hidden bg-black text-white"
      aria-labelledby="dingry-atelier-hero-title"
    >
      <div className="relative flex min-h-[min(100dvh,56rem)] w-full flex-col justify-end">
        <AtelierHeroImage />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25"
          aria-hidden
        />
        <div className="relative z-20 mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-10 pt-24 sm:px-6 md:pb-14 md:pt-28 pointer-events-auto">
          <p className="dingry-section-eyebrow">{eyebrow}</p>
          <h2
            id="dingry-atelier-hero-title"
            className="dingry-atelier-hero__title gold-text dingry-typo-street max-w-2xl text-[clamp(1.75rem,5vw,3.25rem)] leading-[1.05]"
          >
            {title}
          </h2>
          <p className="max-w-xl text-base text-white/90 md:text-lg">{lead}</p>
          <p className="text-sm font-medium tracking-wide text-[#d4af37]">
            Supplément personnalisation&nbsp;: +{PERSONALIZATION_SURCHARGE_EUR}&nbsp;€
          </p>
          <AtelierHeroCta cta={cta} onOpen={() => onOpenCustom()} />
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
      className="dingry-gold-pill-btn relative z-20 mt-2 h-11 w-fit min-w-[10rem] cursor-pointer rounded-full px-8 text-sm font-semibold uppercase tracking-[0.12em]"
    >
      <span className="gold-text">{cta}</span>
    </button>
  );
}
