"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdminCategoryFilterNav } from "@/components/organisms/admin/admin-category-filter-nav";
import type { AdminProductCategoryFilter } from "@/lib/shop-data";

type AdminStockStickyFiltersProps = {
  categoryFilter: AdminProductCategoryFilter;
  onCategoryChange: (category: AdminProductCategoryFilter) => void;
  /** Recherche + actions compactes (même panneau que les catégories). */
  children: ReactNode;
  mobileContextSlot?: ReactNode;
};

export function AdminStockStickyFilters({
  categoryFilter,
  onCategoryChange,
  children,
  mobileContextSlot,
}: AdminStockStickyFiltersProps) {
  const [compact, setCompact] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCompact(!(entry?.isIntersecting ?? true)),
      { root: null, rootMargin: "-72px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <div
        className={`dingry-admin-stock-sticky sticky z-20 -mx-6 border-b border-white/[0.06] bg-[#070b14]/85 px-6 backdrop-blur-md transition-[padding] duration-200 md:-mx-10 md:px-10 ${
          compact ? "top-[var(--dingry-admin-header-offset,4.25rem)] py-1.5" : "top-[var(--dingry-admin-header-offset,4.25rem)] py-2.5"
        }`}
        data-compact={compact || undefined}
      >
        <div
          className={`dingry-admin-glass space-y-2 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/15 transition-[padding,gap] duration-200 ${
            compact ? "gap-1.5 p-1.5" : "gap-2 p-2"
          }`}
        >
          {mobileContextSlot}
          <AdminCategoryFilterNav
            selected={categoryFilter}
            onChange={onCategoryChange}
            embedded
            className="max-[449px]:hidden"
          />
          {children}
        </div>
      </div>
    </>
  );
}
