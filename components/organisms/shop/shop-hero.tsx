"use client";

import Image from "next/image";
import { DINGRY_FAVICON_SRC, DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import { DINGRY_HERO_QUOTE, DINGRY_MANIFESTO_FR, DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";

const HERO_IMAGES = [DINGRY_TEASING_HERO_SRC];
const STREET_MARK = "RCKTHSTRT";
const STREET_WATERMARK = "XRCKTHSTRT";

/** Hero maquette : visuel plein écran, tag gauche, citation droite. Nav boutique inchangée. */
export function ShopHero() {
  return (
    <section className="dingry-hero relative h-dvh w-full min-h-[700px] shrink-0 overflow-hidden">
      {HERO_IMAGES.map((img) => (
        <div key={img} className="absolute inset-0">
          <Image
            src={img}
            alt="DINGRY editorial"
            priority
            fill
            sizes="100vw"
            unoptimized
            className="object-cover object-center brightness-90"
          />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/60 via-transparent to-black/35" />

      <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-between px-5 pt-[var(--dingry-nav-h)] pb-20 sm:px-8 md:items-center md:px-16 md:pb-16">
        <div className="mb-[12vh] flex max-w-[min(100%,22rem)] flex-col gap-5 md:mb-0 md:gap-6">
          <div className="hidden border border-white/10 bg-black/70 px-5 py-3 shadow-[0_16px_40px_rgb(0_0_0/0.45)] backdrop-blur-md md:block">
            <h1 className="dingry-typo-manifesto text-[11px] tracking-[0.25em] text-white/90 md:text-xs">
              {DINGRY_MANIFESTO_FR}
            </h1>
          </div>
          <div className="flex items-center gap-3 pl-1">
            <Image
              src={DINGRY_FAVICON_SRC}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
            <div>
              <p className="dingry-typo-street dingry-typo-street--sm text-white">{DINGRY_STREET_LINE}</p>
              <p className="mt-1 text-[11px] font-semibold tracking-[0.28em] text-white/85">{STREET_MARK}</p>
            </div>
          </div>
          <div className="border border-white/10 bg-black/70 px-5 py-3 shadow-[0_16px_40px_rgb(0_0_0/0.45)] backdrop-blur-md md:hidden">
            <h1 className="dingry-typo-manifesto text-[11px] tracking-[0.25em] text-white/90">
              {DINGRY_MANIFESTO_FR}
            </h1>
          </div>
          <div className="max-w-xs text-left md:hidden">
            <div className="mb-3 h-[2px] w-8 bg-white" />
            <p className="text-sm leading-relaxed tracking-wide text-white/85">{DINGRY_HERO_QUOTE}</p>
          </div>
        </div>

        <div className="hidden max-w-xs self-center text-left md:block">
          <div className="mb-4 h-[2px] w-8 bg-white" />
          <p className="text-sm leading-relaxed tracking-wide text-white/85 md:text-base">{DINGRY_HERO_QUOTE}</p>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-6 right-5 z-10 text-[11px] font-semibold tracking-[0.3em] text-white/70 sm:right-8">
        {STREET_WATERMARK}
      </p>
    </section>
  );
}
