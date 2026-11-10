"use client";

import type { RefObject } from "react";
import { StickyScroll, type StickyScrollItem } from "@/components/atoms/ui/sticky-scroll-reveal";
import { DINGRY_STREET_WORDMARK_URL } from "@/lib/dingry-brand";
import { IMAGES } from "@/lib/shop-data";

const EDITORIAL_SCROLL_ITEMS: StickyScrollItem[] = [
  {
    kickerLogo: true,
    title: "Chaque silhouette raconte l'attitude.",
    titleVariant: "street",
    description:
      "DINGRY Paris est une marque de streetwear française en plein développement, qui séduit un public toujours plus large grâce à une identité forte, un style affirmé et surtout un nom aussi original qu'universel.\n\nEntre coupes oversize, finitions soignées et drops en édition limitée, DINGRY réinvente le streetwear premium pensé pour Paris, Lyon et la scène urbaine européenne.",
  },
  {
    title: "ROCK THE STREET.",
    titleVariant: "street",
    titleImage: {
      src: DINGRY_STREET_WORDMARK_URL,
      alt: "ROCK THE STREET.",
    },
    description:
      "DINGRY, c'est peut-être l'un des meilleurs noms qu'une marque de streetwear puisse porter aujourd'hui. Un mot populaire, utilisé par toutes les générations et toutes les classes sociales, qui reflète parfaitement notre époque. Son écriture singulière en fait une signature immédiatement reconnaissable.",
    elasticLogoCenter: true,
  },
];

type HeritageSectionProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

export function HeritageSection({ scrollContainerRef }: HeritageSectionProps) {
  return (
    <section className="dingry-below-hero-surface dingry-gold-rule-top px-6 py-12 md:px-12 md:py-16">
      <p className="dingry-section-eyebrow mb-4">Heritage</p>
      <h2 className="dingry-sticky-editorial-title max-w-xl text-3xl uppercase leading-tight md:text-5xl">
        True luxury is attitude.
      </h2>
      <p className="dingry-sticky-copy mt-6 max-w-xl text-sm leading-relaxed text-white/70">
        DINGRY est une attitude. Une vision du luxe qui ne demande pas la permission.
      </p>
      <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-white/45">DINGRY — Rock the Street</p>
      <StickyScroll
        scrollContainerRef={scrollContainerRef}
        items={EDITORIAL_SCROLL_ITEMS}
        stickyPanel={
          <div className="dingry-editorial-frame relative w-full md:p-3">
            <div className="dingry-editorial-frame__inner relative">
              <img
                src={IMAGES.editorial}
                alt="DINGRY editorial"
                className="block h-auto w-full object-cover object-center"
                style={{ filter: "brightness(0.75) contrast(1.1) grayscale(0.4)" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/35 via-transparent to-transparent" />
            </div>
          </div>
        }
      />
    </section>
  );
}
