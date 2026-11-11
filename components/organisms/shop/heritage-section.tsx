"use client";

import {
  DINGRY_HERITAGE_BASELINE,
  DINGRY_HERITAGE_HOMEPAGE_HOOK,
} from "@/lib/dingry-heritage-content";
import { DINGRY_HERITAGE_EDITORIAL_SRC } from "@/lib/dingry-brand";

type HeritageSectionProps = {
  onOpenHeritage: () => void;
};

export function HeritageSection({ onOpenHeritage }: HeritageSectionProps) {

  return (
    <section className="dingry-below-hero-surface dingry-gold-rule-top py-10 md:py-14">
      <p className="dingry-section-eyebrow mb-4">Héritage</p>

      <div className="dingry-heritage-teaser group relative isolate w-full overflow-hidden">
        <img
          src={DINGRY_HERITAGE_EDITORIAL_SRC}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="relative z-10 flex min-h-[12.5rem] flex-col justify-end gap-4 px-5 py-8 sm:min-h-[14rem] md:min-h-[16.5rem] md:px-10 md:py-11 lg:max-w-[48rem]">
          <h2 className="dingry-sticky-editorial-title text-2xl uppercase leading-tight text-white md:text-4xl">
            {DINGRY_HERITAGE_BASELINE}
          </h2>
          <p className="dingry-heritage-teaser-hook max-w-md text-sm leading-relaxed text-white md:text-base">
            {DINGRY_HERITAGE_HOMEPAGE_HOOK}
          </p>
          <button type="button" onClick={onOpenHeritage} className="dingry-heritage-teaser-cta mt-2 w-fit">
            Découvrir l&apos;histoire
          </button>
        </div>
      </div>
    </section>
  );
}
