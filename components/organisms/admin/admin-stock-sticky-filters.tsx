"use client";

import type { ReactNode } from "react";
import { AdminCategoryFilterNav } from "@/components/organisms/admin/admin-category-filter-nav";
import type { AdminProductCategoryFilter } from "@/lib/shop-data";

type AdminStockStickyFiltersProps = {
  categoryFilter: AdminProductCategoryFilter;
  onCategoryChange: (category: AdminProductCategoryFilter) => void;
  children: ReactNode;
  mobileContextSlot?: ReactNode;
  highlight?: boolean;
};

export function AdminStockStickyFilters({
  categoryFilter,
  onCategoryChange,
  children,
  mobileContextSlot,
  highlight = false,
}: AdminStockStickyFiltersProps) {
  return (
    <div
      id="dingry-admin-stock-filters-anchor"
      className="dingry-admin-stock-filters sticky top-[calc(var(--dingry-admin-header-offset,3rem)+0.35rem)] z-[91] mb-3 max-md:min-w-0 max-md:max-w-full bg-black/80 py-1 backdrop-blur-md md:flex md:w-full md:justify-center"
    >
      <div
        className={`dingry-admin-stock-filters-plaque relative space-y-2 overflow-hidden rounded-3xl p-2.5 pb-3 max-md:min-w-0 max-md:max-w-full min-[450px]:space-y-2.5 min-[450px]:p-3 min-[450px]:pb-3.5 md:w-auto md:max-w-full ${
          highlight ? "dingry-admin-stock-filters-plaque--flash" : ""
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
  );
}