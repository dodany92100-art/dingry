"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { AdminProductCategoryFilter } from "@/lib/shop-data";
import { ADMIN_PRODUCT_CATEGORY_NAV } from "@/lib/shop-data";

type AdminCategoryFilterNavProps = {
  selected: AdminProductCategoryFilter;
  onChange: (category: AdminProductCategoryFilter) => void;
};

const INDICATOR_LAYOUT_ID = "dingry-admin-category-filter-indicator";

export function AdminCategoryFilterNav({ selected, onChange }: AdminCategoryFilterNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<AdminProductCategoryFilter, HTMLButtonElement>());

  const registerTab = useCallback(
    (category: AdminProductCategoryFilter) => (node: HTMLButtonElement | null) => {
      if (node) tabRefs.current.set(category, node);
      else tabRefs.current.delete(category);
    },
    [],
  );

  useEffect(() => {
    const node = tabRefs.current.get(selected);
    const scroller = scrollRef.current;
    if (!node || !scroller) return;
    const tabLeft = node.offsetLeft;
    const tabWidth = node.offsetWidth;
    const target = tabLeft - scroller.clientWidth / 2 + tabWidth / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [selected]);

  return (
    <div className="-mx-6 px-6 md:-mx-10 md:px-10">
      <div className="relative max-w-full">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#070b14] via-[#070b14]/80 to-transparent md:w-12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#070b14] via-[#070b14]/80 to-transparent md:w-12"
          aria-hidden
        />
        <div
          ref={scrollRef}
          className="overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            className="dingry-admin-glass inline-flex min-w-max items-center gap-0.5 rounded-full p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/15"
            role="tablist"
            aria-label="Filtrer par catégorie produit"
          >
            {ADMIN_PRODUCT_CATEGORY_NAV.map((category) => {
              const active = selected === category;
              return (
                <button
                  key={category}
                  ref={registerTab(category)}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChange(category)}
                  className="relative z-0 shrink-0 rounded-full px-3.5 py-2 transition-colors duration-200 md:px-4 md:py-2.5"
                >
                  {active ? (
                    <motion.span
                      layoutId={INDICATOR_LAYOUT_ID}
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-white to-violet-100/90 shadow-[0_4px_24px_rgba(167,139,250,0.35),0_0_0_1px_rgba(255,255,255,0.25)_inset]"
                      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={`relative z-10 block whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.18em] md:text-[11px] md:tracking-[0.2em] ${
                      active ? "text-[#0a0f18]" : "text-white/50 hover:text-white/85"
                    }`}
                  >
                    {category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
