"use client";

import Image from "next/image";
import { DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import { useTranslation } from "@/hooks/use-translation";

const HERO_IMAGE = DINGRY_TEASING_HERO_SRC;

type ShopHeroProps = {
  onDiscoverCollection?: () => void;
};

export function ShopHero({ onDiscoverCollection }: ShopHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="dingry-hero relative h-[100dvh] w-full shrink-0 overflow-hidden bg-black text-white md:min-h-[700px]">
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGE}
          alt="DINGRY Hero"
          priority
          fill
          sizes="100vw"
          unoptimized
          className="object-cover object-[50%_38%] md:object-contain md:object-center"
        />
      </div>
      {onDiscoverCollection ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-10 md:pb-14">
          <button
            type="button"
            onClick={onDiscoverCollection}
            className="dingry-gold-pill-btn dingry-interactive-luxe pointer-events-auto px-6 py-3 text-[10px] font-semibold tracking-[0.28em] uppercase"
          >
            <span className="gold-text">{t("cart.drawer.discoverCollection")}</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}