"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { DingryLogo } from "@/components/atoms/dingry-logo";
import { DINGRY_MANIFESTO_FR } from "@/lib/dingry-brand-voice";
import { DINGRY_LOGO_URL } from "@/lib/dingry-brand";
import { cn } from "@/lib/utils";

export type StickyScrollItem = {
  title: string;
  description: string;
  kicker?: string;
  /** Titre en Anton (street) vs éditorial bold */
  titleVariant?: "street" | "editorial";
  /** Logo DINGRY détouré à la place du kicker texte */
  kickerLogo?: boolean;
  /** Logo animé (élastique), centré sous le texte */
  elasticLogoCenter?: boolean;
  /** Remplace le titre texte (ex. wordmark ROCK THE STREET). */
  titleImage?: { src: string; alt: string };
};

type StickyScrollProps = {
  items: StickyScrollItem[];
  stickyPanel: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  className?: string;
  stickyClassName?: string;
};

export function StickyScroll({
  items,
  stickyPanel,
  scrollContainerRef,
  className,
  stickyClassName,
}: StickyScrollProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = scrollContainerRef?.current ?? null;
    const blocks = blockRefs.current.filter((node): node is HTMLDivElement => node !== null);
    if (blocks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!top) return;
        const index = Number(top.target.getAttribute("data-index"));
        if (Number.isNaN(index)) return;
        requestAnimationFrame(() => {
          setActiveIndex((prev) => (prev === index ? prev : index));
        });
      },
      {
        root,
        rootMargin: "-42% 0px -42% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    blocks.forEach((block) => observer.observe(block));
    return () => observer.disconnect();
  }, [items.length, scrollContainerRef]);

  return (
    <div className={cn("relative flex flex-col gap-10 lg:flex-row lg:gap-16", className)}>
      <div className="relative w-full overflow-hidden lg:hidden">{stickyPanel}</div>

      <div className="relative flex-1 lg:py-6">
        {items.map((item, index) => (
          <div
            key={item.title}
            ref={(node) => {
              blockRefs.current[index] = node;
            }}
            data-index={index}
            className={cn(
              "flex min-h-[55vh] flex-col py-8 lg:min-h-[72vh] lg:py-16",
              item.elasticLogoCenter ? "justify-start" : "justify-center",
            )}
          >
            {item.kickerLogo ? (
              <div className="mb-4 max-w-md md:mb-5">
                <DingryLogo animate={false} className="dingry-editorial-logo h-9 w-auto md:h-11" />
                <p className="dingry-typo-manifesto mt-4 text-[10px] text-white/75">{DINGRY_MANIFESTO_FR}</p>
              </div>
            ) : item.kicker ? (
              <p className="mb-4 max-w-md text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0066FF] md:mb-5">
                {item.kicker}
              </p>
            ) : null}
            {item.titleImage ? (
              <h3 className="max-w-md">
                <img
                  src={item.titleImage.src}
                  alt={item.titleImage.alt}
                  className="h-auto w-full max-w-[22rem] object-contain object-left md:max-w-md"
                />
              </h3>
            ) : (
            <h3
              className={cn(
                item.titleVariant === "street"
                  ? cn(
                      "dingry-sticky-street-title dingry-typo-street max-w-md",
                      item.elasticLogoCenter ? "dingry-typo-street--lg" : "dingry-typo-street--md",
                    )
                  : "dingry-sticky-editorial-title max-w-md text-3xl font-bold uppercase leading-tight tracking-tight md:text-4xl md:text-5xl",
              )}
            >
              {item.title}
            </h3>
            )}
            <p className="dingry-sticky-copy mt-6 max-w-lg whitespace-pre-line text-base leading-relaxed text-white/60 md:text-[1.0625rem] md:leading-[1.75]">
              {item.description}
            </p>
            {item.elasticLogoCenter ? (
              <div className="flex w-full flex-1 items-center justify-center pt-8 md:pt-10">
                <img
                  src={DINGRY_LOGO_URL}
                  alt="DINGRY Paris"
                  decoding="async"
                  className="dingry-editorial-logo dingry-logo-elastic"
                />
              </div>
            ) : null}
          </div>
        ))}
        <p
          className="dingry-footer-index mt-8 text-center lg:hidden"
          aria-live="polite"
          aria-label={`Bloc ${activeIndex + 1} sur ${items.length}`}
        >
          {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </p>
      </div>

      <div
        className={cn(
          "sticky top-8 hidden w-full flex-1 self-start lg:block",
          stickyClassName,
        )}
      >
        <div key={activeIndex} className="dingry-gpu-layer dingry-sticky-panel-fade w-full">
          {stickyPanel}
        </div>
      </div>
    </div>
  );
}
