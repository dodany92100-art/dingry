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
    <div className="dingry-admin-stock-filters mb-3 py-1">
      <div className="dingry-admin-glass space-y-2 rounded-2xl p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/15">
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