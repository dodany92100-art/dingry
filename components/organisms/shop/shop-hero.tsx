"use client";

import Image from "next/image";
import { DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";

const HERO_IMAGE = DINGRY_TEASING_HERO_SRC;

export function ShopHero() {
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
    </section>
  );
}
