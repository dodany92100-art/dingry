"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { DingryLogo } from "@/components/dingry-logo";
import { cn } from "@/lib/utils";

export type StickyScrollItem = {
  title: string;
  description: string;
  kicker?: string;
  /** Logo DINGRY détouré à la place du kicker texte */
  kickerLogo?: boolean;
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
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top) return;
        const index = Number(top.target.getAttribute("data-index"));
        if (!Number.isNaN(index)) setActiveIndex(index);
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
            className="flex min-h-[55vh] flex-col justify-center py-8 lg:min-h-[72vh] lg:py-16"
          >
            {item.kickerLogo ? (
              <div className="mb-4 max-w-md md:mb-5">
                <DingryLogo animate={false} className="dingry-editorial-logo h-9 w-auto md:h-11" />
              </div>
            ) : item.kicker ? (
              <p className="mb-4 max-w-md text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0066FF] md:mb-5">
                {item.kicker}
              </p>
            ) : null}
            <h3 className="text-3xl font-bold uppercase leading-tight tracking-tight md:text-4xl md:text-5xl">
              {item.title}
            </h3>
            <p className="mt-6 max-w-md whitespace-pre-line text-sm leading-relaxed text-white/55">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "sticky top-8 hidden w-full flex-1 self-start lg:block",
          stickyClassName,
        )}
      >
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0.92, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          {stickyPanel}
        </motion.div>
      </div>
    </div>
  );
}
