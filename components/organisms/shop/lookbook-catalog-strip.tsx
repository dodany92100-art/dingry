"use client";

import { useEffect, useRef, useState } from "react";
import { LOOKBOOK_ENTRIES } from "@/lib/shop-data";

export type LookbookSlide = {
  id: string;
  title: string;
  caption: string;
  image: string;
};

function fallbackSlides(): LookbookSlide[] {
  return LOOKBOOK_ENTRIES.map(([image, title, caption], index) => ({
    id: `fallback-${index}`,
    title,
    caption,
    image,
  }));
}

/** Section lookbook autonome (nav LOOKBOOK) — hors grille catalogue. */
export function LookbookCatalogStrip() {
  const [slides, setSlides] = useState<LookbookSlide[]>(() => fallbackSlides());
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/lookbook");
        if (!response.ok) return;
        const data = (await response.json()) as { slides?: LookbookSlide[] };
        if (!cancelled && Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
        }
      } catch {
        /* fallback statique */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="dingry-gold-rule-top scroll-mt-28 py-16 md:py-20">
      <p className="dingry-section-eyebrow mb-5 md:mb-6">Lookbook</p>

      <div className="relative -mx-1 md:-mx-0">
        <div
          ref={scrollerRef}
          className="dingry-lookbook-carousel flex gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 touch-pan-x snap-x snap-mandatory md:gap-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Carrousel lookbook"
        >
          {slides.map((slide, index) => (
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
              <figcaption className="mt-3">
                <p className="line-clamp-2 text-sm uppercase tracking-wide">{slide.title}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">{slide.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
