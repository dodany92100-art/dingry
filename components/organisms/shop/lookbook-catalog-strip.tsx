"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/use-translation";

export type LookbookSlide = {
  id: string;
  title: string;
  caption: string;
  image: string;
};

type LookbookLoadState = "idle" | "ready" | "error";

/** Section lookbook autonome (nav LOOKBOOK) — hors grille catalogue, slides CRM uniquement. */
export function LookbookCatalogStrip() {
  const { t } = useTranslation();
  const [slides, setSlides] = useState<LookbookSlide[]>([]);
  const [loadState, setLoadState] = useState<LookbookLoadState>("idle");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/lookbook");
        if (!response.ok) {
          if (!cancelled) setLoadState("error");
          return;
        }
        const data = (await response.json()) as { slides?: LookbookSlide[] };
        if (cancelled) return;
        setSlides(Array.isArray(data.slides) ? data.slides.filter((s) => s.image?.trim()) : []);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadState === "ready" && slides.length === 0) return null;
  if (loadState === "error") return null;

  return (
    <section className="dingry-lookbook-band dingry-gold-rule-top scroll-mt-28 -mx-4 bg-[#050505] px-4 py-16 sm:-mx-6 sm:px-6 md:py-20 lg:-mx-8 lg:px-8">
      <header className="mb-8 md:mb-10">
        <p className="dingry-section-eyebrow">{t("lookbookTeaser.eyebrow")}</p>
        <h2 className="mt-3 text-[clamp(1.35rem,3.2vw,2rem)] font-medium tracking-[0.04em] text-white">
          {t("lookbookTeaser.title")}
        </h2>
      </header>
      {loadState === "idle" ? (
        <div
          className="dingry-lookbook-carousel flex w-full gap-3 overflow-hidden md:gap-4"
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] w-[min(72vw,15.5rem)] shrink-0 animate-pulse bg-white/10 sm:w-[min(42vw,16rem)] md:w-[18rem]"
            />
          ))}
        </div>
      ) : (
        <div className="relative -mx-1 md:-mx-0">
          <div
            className="dingry-lookbook-carousel flex w-full gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 snap-x snap-mandatory [touch-action:pan-x_pan-y] md:gap-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Carrousel lookbook"
          >
            {slides.map((slide) => (
              <figure
                key={slide.id}
                className="w-[min(72vw,15.5rem)] shrink-0 snap-center snap-always overflow-hidden sm:w-[min(42vw,16rem)] md:w-[18rem]"
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/4] w-full object-cover"
                />
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}