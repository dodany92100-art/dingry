"use client";

import Image from "next/image";
import { DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";

const HERO_IMAGE = DINGRY_TEASING_HERO_SRC;

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
          className="object-contain object-center"
        />
      </div>
    </section>
  );
}
