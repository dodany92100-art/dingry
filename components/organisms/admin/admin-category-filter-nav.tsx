"use client";

import type { AdminProductCategoryFilter } from "@/lib/shop-data";
import { ADMIN_PRODUCT_CATEGORY_NAV } from "@/lib/shop-data";

type AdminCategoryFilterNavProps = {
  selected: AdminProductCategoryFilter;
  onChange: (category: AdminProductCategoryFilter) => void;
};

export function AdminCategoryFilterNav({ selected, onChange }: AdminCategoryFilterNavProps) {
  return (
    <div className="-mx-6 overflow-x-auto px-6 md:-mx-10 md:px-10">
      <div
        className="flex min-w-max gap-2 pb-1"
        role="tablist"
        aria-label="Filtrer par catégorie produit"
      >
        {ADMIN_PRODUCT_CATEGORY_NAV.map((category) => {
          const active = selected === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(category)}
              className={`shrink-0 whitespace-nowrap px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition md:px-4 md:text-[11px] md:tracking-[0.22em] ${
                active
                  ? "bg-white text-black"
                  : "border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
