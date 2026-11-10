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
          className="object-cover object-[center_32%] brightness-90 sm:object-[center_36%] md:object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" aria-hidden />
      </div>
    </section>
  );
}
