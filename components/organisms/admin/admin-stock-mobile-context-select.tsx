"use client";

import type { TabId } from "@/components/organisms/admin/tab-nav";
import type { AdminProductCategoryFilter } from "@/lib/shop-data";
import { ADMIN_PRODUCT_CATEGORY_NAV } from "@/lib/shop-data";

const STOCK_TAB_OPTIONS: readonly { tab: TabId; label: string; publish: "live" | "draft" }[] = [
  { tab: "produits", label: "Stock", publish: "live" },
  { tab: "brouillons", label: "Brouillons", publish: "draft" },
];

function encodeValue(tab: TabId, category: AdminProductCategoryFilter): string {
  return `${tab}::${category}`;
}

function decodeValue(
  raw: string,
): { tab: TabId; category: AdminProductCategoryFilter } | null {
  const [tab, category] = raw.split("::") as [TabId, AdminProductCategoryFilter];
  if (!STOCK_TAB_OPTIONS.some((row) => row.tab === tab)) return null;
  if (!ADMIN_PRODUCT_CATEGORY_NAV.includes(category)) return null;
  return { tab, category };
}

type AdminStockMobileContextSelectProps = {
  tab: TabId;
  categoryFilter: AdminProductCategoryFilter;
  onTabChange: (tab: TabId) => void;
  onCategoryChange: (category: AdminProductCategoryFilter) => void;
};

/** &lt; 450px : onglet Stock/Brouillons + catégorie dans un seul sélecteur. */
export function AdminStockMobileContextSelect({
  tab,
  categoryFilter,
  onTabChange,
  onCategoryChange,
}: AdminStockMobileContextSelectProps) {
  const value = encodeValue(tab, categoryFilter);

  return (
    <label className="dingry-admin-glass flex min-w-0 items-center gap-2 rounded-full px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/15 max-[449px]:flex min-[450px]:hidden">
      <span className="sr-only">Section et catégorie</span>
      <select
        value={value}
        onChange={(event) => {
          const parsed = decodeValue(event.target.value);
          if (!parsed) return;
          if (parsed.tab !== tab) onTabChange(parsed.tab);
          if (parsed.category !== categoryFilter) onCategoryChange(parsed.category);
        }}
        className="min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-transparent py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white focus:outline-none"
      >
        {STOCK_TAB_OPTIONS.flatMap((row) =>
          ADMIN_PRODUCT_CATEGORY_NAV.map((category) => (
            <option key={encodeValue(row.tab, category)} value={encodeValue(row.tab, category)}>
              {row.label} · {category}
            </option>
          )),
        )}
      </select>
    </label>
  );
}
