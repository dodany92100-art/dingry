"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DINGRY_HERITAGE_EDITORIAL_SRC } from "@/lib/dingry-brand";
import { shopBasePathFromPathname, shopHref } from "@/lib/shop-base-path";
import { useTranslation } from "@/hooks/use-translation";

export function HeritageSection() {
  const pathname = usePathname() ?? "/";
  const heritageHref = shopHref(shopBasePathFromPathname(pathname), "/heritage");
  const { dict, t } = useTranslation();
  const heritage = dict.heritage;

  return (
    <section className="dingry-below-hero-surface dingry-gold-rule-top py-10 md:py-14">
      <p className="dingry-section-eyebrow mb-4 md:mb-5">{t("heritageTeaser.eyebrow")}</p>

      <div className="dingry-heritage-teaser group relative isolate mx-auto w-full max-w-5xl overflow-hidden rounded-2xl">
        <img
          src={DINGRY_HERITAGE_EDITORIAL_SRC}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="dingry-heritage-teaser-panel relative z-10 flex min-h-[12.5rem] flex-col justify-end gap-4 px-5 py-8 sm:min-h-[14rem] md:min-h-[16.5rem] md:px-10 md:py-11 lg:max-w-[48rem]">
          <h2 className="dingry-sticky-editorial-title text-2xl uppercase leading-tight text-white md:text-4xl">
            {heritage.baseline}
          </h2>
          <p className="dingry-heritage-teaser-hook max-w-md text-sm leading-relaxed text-white md:text-base">
            {heritage.homepageHook}
          </p>
          <Link
            href={heritageHref}
            className="dingry-heritage-teaser-cta mt-2 w-fit shrink-0 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] transition-[border-color,box-shadow,background,transform] duration-200 active:scale-[0.97] sm:px-7 sm:text-[11px] sm:tracking-[0.3em]"
          >
            <span className="gold-text">{heritage.ctaDiscover}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
