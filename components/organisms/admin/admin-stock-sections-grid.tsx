"use client";

import type { AdminProduct } from "@/lib/admin/types";
import type { AdminStockMenuSection } from "@/lib/admin/stock-menu-sections";
import { AdminStockProductCard } from "@/components/organisms/admin/admin-stock-product-card";
import { ADMIN_STOCK_PRODUCT_GRID_CLASS } from "@/components/organisms/shop/catalog-layout";

type AdminStockSectionsGridProps = {
  sections: AdminStockMenuSection[];
  indexByProductId: ReadonlyMap<string, number>;
  busyProductId: string | null;
  reorderBlocked: boolean;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  onEdit: (product: AdminProduct) => void;
  onTogglePin: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onDrop: (fromIndex: number, toIndex: number) => void;
};

/** Grille Stock par familles (titres alignés menu boutique). */
export function AdminStockSectionsGrid({
  sections,
  indexByProductId,
  busyProductId,
  reorderBlocked,
  onChangeStock,
  onSetStock,
  onEdit,
  onTogglePin,
  onDelete,
  onDrop,
}: AdminStockSectionsGridProps) {
  return (
    <div className="space-y-8 md:space-y-9">
      {sections.map((section) => (
        <section key={section.category} className="space-y-4">
          <h3 className="border-b border-white/[0.08] pb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white md:text-xs">
            {section.label}
          </h3>
          <div className={ADMIN_STOCK_PRODUCT_GRID_CLASS}>
            {section.products.map((product) => {
              const dragIndex = indexByProductId.get(product.id);
              if (dragIndex === undefined) return null;
              return (
                <AdminStockProductCard
                  key={product.id}
                  product={product}
                  dragIndex={dragIndex}
                  busy={busyProductId === product.id}
                  onChangeStock={onChangeStock}
                  onSetStock={onSetStock}
                  onEdit={onEdit}
                  onTogglePin={onTogglePin}
                  onDelete={onDelete}
                  onDrop={onDrop}
                  disableReorder={reorderBlocked}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
