"use client";

import { DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import {
  DINGRY_HERO_EDITORIAL_LINES,
  DINGRY_MANIFESTO_EN,
  DINGRY_MANIFESTO_FR,
  DINGRY_STREET_LINE,
} from "@/lib/dingry-brand-voice";

const HERO_IMAGES = [DINGRY_TEASING_HERO_SRC];

/** Même cadrage que le teaser (cover + hauteur viewport). */
export function ShopHero() {
  return (
    <section className="dingry-hero relative h-dvh w-full shrink-0 overflow-hidden">
      {HERO_IMAGES.map((img) => (
        <img
          key={img}
          src={img}
          alt="DINGRY editorial"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ))}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-end px-5 pb-8 pt-[var(--dingry-nav-h)] sm:px-8 sm:pb-10 md:items-center md:px-16 md:pb-0">
        <div className="dingry-brand-reveal dingry-hero-copy w-full max-w-[19rem] sm:max-w-sm md:max-w-md">
          <h1 className="dingry-typo-manifesto">{DINGRY_MANIFESTO_FR}</h1>
          <p className="dingry-typo-manifesto-en mt-3">{DINGRY_MANIFESTO_EN}</p>
          <div className="mt-4 h-px w-14 bg-white/70" />
          <p className="dingry-typo-street dingry-typo-street--sm mt-4">{DINGRY_STREET_LINE}</p>
          <p className="dingry-typo-body-alt mt-4">
            {DINGRY_HERO_EDITORIAL_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
