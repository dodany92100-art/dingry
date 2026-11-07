"use client";

import Image from "next/image";
import { DINGRY_FAVICON_SRC, DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import { DINGRY_HERO_QUOTE, DINGRY_MANIFESTO_FR, DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";

const HERO_IMAGES = [DINGRY_TEASING_HERO_SRC];
const STREET_MARK = "RCKTHSTRT";
const STREET_WATERMARK = "XRCKTHSTRT";

const manifestoCardClass =
  "rounded-sm border border-white/10 bg-black/60 px-4 py-2 shadow-[0_16px_40px_rgb(0_0_0/0.45)] backdrop-blur-md md:bg-black/70 md:px-5 md:py-3";

/** Hero maquette : visuel plein écran, overlays en bas sur mobile pour libérer le centre (logo tee). */
export function ShopHero() {
  return (
    <section className="dingry-hero relative h-dvh w-full min-h-[650px] shrink-0 overflow-hidden bg-black md:min-h-[750px]">
      {HERO_IMAGES.map((img) => (
        <div key={img} className="absolute inset-0 z-0">
          <Image
            src={img}
            alt="DINGRY editorial"
            priority
            fill
            sizes="100vw"
            unoptimized
            className="object-cover object-center brightness-90 md:brightness-100"
          />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/40 to-black/30 md:via-transparent md:to-black/40" />

      <div className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-end px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[var(--dingry-nav-h)] sm:px-8 md:flex-row md:items-center md:justify-between md:px-16 md:pb-16">
        <div className="pointer-events-auto mb-3 flex w-full max-w-md flex-col gap-3 md:mb-0 md:max-w-[min(100%,22rem)] md:gap-6">
          <div className={`${manifestoCardClass} md:order-1`}>
            <h1 className="dingry-typo-manifesto text-[11px] tracking-[0.2em] text-gray-200 md:text-xs md:tracking-[0.25em] md:text-white/90">
              {DINGRY_MANIFESTO_FR}
            </h1>
          </div>

          <div className="flex items-center gap-3 pl-0.5 md:order-2 md:pl-1">
            <Image
              src={DINGRY_FAVICON_SRC}
              alt=""
              width={48}
              height={48}
              className="h-8 w-8 object-contain md:h-12 md:w-12"
            />
            <div>
              <p className="dingry-typo-street dingry-typo-street--sm text-[10px] text-white md:text-[inherit]">
                {DINGRY_STREET_LINE}
              </p>
              <p className="mt-0.5 text-[10px] font-bold tracking-[0.2em] text-white md:mt-1 md:text-[11px] md:font-semibold md:tracking-[0.28em] md:text-white/85">
                {STREET_MARK}
              </p>
            </div>
          </div>
        </div>

        <div className={`pointer-events-auto max-w-xs text-left md:self-center ${manifestoCardClass} md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none`}>
          <div className="mb-3 h-[2px] w-8 bg-white md:mb-4" />
          <p className="text-xs leading-relaxed tracking-wide text-gray-200 md:text-sm md:text-white/85 md:text-base">
            {DINGRY_HERO_QUOTE}
          </p>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-3 right-5 z-10 hidden text-[10px] font-semibold tracking-[0.3em] text-white/50 sm:block md:bottom-6 md:right-8 md:text-[11px] md:text-white/70">
        {STREET_WATERMARK}
      </p>
    </section>
  );
}
