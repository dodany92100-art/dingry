"use client";

import Image from "next/image";
import { DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import { DINGRY_HERO_QUOTE, DINGRY_MANIFESTO_FR } from "@/lib/dingry-brand-voice";

const HERO_IMAGE = DINGRY_TEASING_HERO_SRC;
const STREET_WATERMARK = "XRCKTHSTRT";

/** Hero : manifeste dossier (gauche), accroche hauteur coude (droite). */
export function ShopHero() {
  return (
    <section className="dingry-hero relative h-dvh w-full min-h-[700px] shrink-0 overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGE}
          alt="DINGRY Hero"
          priority
          fill
          sizes="100vw"
          unoptimized
          className="object-cover object-[center_32%] brightness-90 sm:object-[center_36%] md:object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" aria-hidden />
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[var(--dingry-nav-h)] z-10 px-5 md:px-8">
        <div className="relative mx-auto h-full w-full max-w-7xl">
          <span className="absolute left-0 top-[30%] max-w-[14rem] text-xs font-medium uppercase tracking-[0.25em] text-white [text-shadow:0_1px_14px_rgb(0_0_0/0.45)] sm:top-[32%] md:top-[34%] md:max-w-none">
            {DINGRY_MANIFESTO_FR}
          </span>

          <div className="absolute left-0 top-[52%] max-w-xs text-left sm:top-[50%] md:left-auto md:right-0 md:top-[48%] md:max-w-sm">
            <div className="mb-4 h-0.5 w-8 bg-white" />
            <p className="text-sm font-normal leading-relaxed tracking-wide text-gray-200">{DINGRY_HERO_QUOTE}</p>
          </div>

          <p className="pointer-events-none absolute bottom-0 right-0 text-xs font-bold tracking-[0.3em] text-white">
            {STREET_WATERMARK}
          </p>
        </div>
      </div>
    </section>
  );
}
