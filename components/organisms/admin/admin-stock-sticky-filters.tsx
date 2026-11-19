"use client";

import type { ReactNode } from "react";
import { AdminCategoryFilterNav } from "@/components/organisms/admin/admin-category-filter-nav";
import type { AdminProductCategoryFilter } from "@/lib/shop-data";

type AdminStockStickyFiltersProps = {
  categoryFilter: AdminProductCategoryFilter;
  onCategoryChange: (category: AdminProductCategoryFilter) => void;
  children: ReactNode;
  mobileContextSlot?: ReactNode;
};

export function AdminStockStickyFilters({
  categoryFilter,
  onCategoryChange,
  children,
  mobileContextSlot,
}: AdminStockStickyFiltersProps) {
  return (
    <div className="dingry-admin-stock-filters mb-3 max-md:min-w-0 max-md:max-w-full py-1 md:flex md:w-full md:justify-center">
      <div className="dingry-admin-surface-linear space-y-1.5 rounded-xl p-1.5 max-md:min-w-0 max-md:max-w-full max-md:overflow-hidden min-[450px]:space-y-2 min-[450px]:p-2.5 md:w-auto md:max-w-full">
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