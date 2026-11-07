"use client";

import Image from "next/image";
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
        <div key={img} className="absolute inset-0">
          <Image
            src={img}
            alt="DINGRY editorial"
            priority
            fill
            sizes="100vw"
            unoptimized
            className="object-cover object-center"
          />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-end px-5 pb-14 pt-[var(--dingry-nav-h)] sm:px-8 sm:pb-16 md:items-end md:px-16 md:pb-[20vh]">
        <div className="dingry-brand-reveal dingry-hero-copy w-full max-w-[21rem] -translate-y-1 sm:max-w-md sm:-translate-y-2 md:max-w-lg md:-translate-y-4">
          <div className="dingry-hero-manifesto-lead">
            <h1 className="dingry-typo-manifesto">{DINGRY_MANIFESTO_FR}</h1>
            <p className="dingry-typo-manifesto-en mt-2">{DINGRY_MANIFESTO_EN}</p>
          </div>
          <div className="mt-5 h-px w-14 bg-white/70 md:mt-6" />
          <p className="dingry-typo-street dingry-typo-street--sm mt-4">{DINGRY_STREET_LINE}</p>
          <p className="dingry-typo-street dingry-hero-editorial mt-10 md:mt-14">
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
