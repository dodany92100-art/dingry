"use client";

import type { StockAutosaveStatusMap } from "@/lib/admin/stock-autosave-types";
import type { AdminProduct } from "@/lib/admin/types";
import type { AdminStockMenuSection } from "@/lib/admin/stock-menu-sections";
import { AdminStockBulkEditBar } from "@/components/organisms/admin/admin-stock-bulk-edit-bar";
import { AdminStockProductCard } from "@/components/organisms/admin/admin-stock-product-card";
import { ADMIN_STOCK_PRODUCT_GRID_CLASS } from "@/components/organisms/shop/catalog-layout";
import type { CatalogCategory } from "@/lib/catalog-category";

type AdminStockSectionsGridProps = {
  sections: AdminStockMenuSection[];
  indexByProductId: ReadonlyMap<string, number>;
  busyProductId: string | null;
  reorderBlocked: boolean;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  onChangePrice: (product: AdminProduct, delta: number) => void;
  onSetPrice: (product: AdminProduct, nextPrice: number) => void;
  onEdit: (product: AdminProduct) => void;
  onTogglePin: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onDrop: (fromIndex: number, toIndex: number) => void;
  stockAutosaveStatus?: StockAutosaveStatusMap;
  bulkEditAll: boolean;
  bulkEditSection: CatalogCategory | null;
  bulkSelectedIds: ReadonlySet<string>;
  onEnterBulkEditSection: (category: CatalogCategory, products: readonly AdminProduct[]) => void;
  onBulkSelectToggle: (productId: string, selected: boolean) => void;
  onBulkSelectAllInSection: (sectionProducts: readonly AdminProduct[], selected: boolean) => void;
  onBulkStockDelta: (targets: readonly AdminProduct[], delta: number) => void;
  onBulkPriceDelta: (targets: readonly AdminProduct[], delta: number) => void;
  onBulkConfirmEdit: () => void;
  onBulkCancelEdit: (scope: readonly AdminProduct[]) => void;
  bulkActionsDisabled?: boolean;
};

/** Grille Stock par familles (titres alignés menu boutique). */
export function AdminStockSectionsGrid({
  sections,
  indexByProductId,
  busyProductId,
  reorderBlocked,
  onChangeStock,
  onSetStock,
  onChangePrice,
  onSetPrice,
  onEdit,
  onTogglePin,
  onDelete,
  onDrop,
  stockAutosaveStatus = {},
  bulkEditAll,
  bulkEditSection,
  bulkSelectedIds,
  onEnterBulkEditSection,
  onBulkSelectToggle,
  onBulkSelectAllInSection,
  onBulkStockDelta,
  onBulkPriceDelta,
  onBulkConfirmEdit,
  onBulkCancelEdit,
  bulkActionsDisabled = false,
}: AdminStockSectionsGridProps) {
  return (
    <div className="space-y-8 md:space-y-9">
      {sections.map((section) => {
        const sectionEditActive = bulkEditSection === section.category;
        const sectionSelectMode = bulkEditAll || sectionEditActive;
        const selectedInSection = section.products.filter((p) => bulkSelectedIds.has(p.id));
        const allInSection = section.products.length > 0 && selectedInSection.length === section.products.length;
        const someInSection = selectedInSection.length > 0 && !allInSection;

        return (
          <section key={section.category} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="border-b border-white/[0.08] pb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white sm:border-0 sm:pb-0 md:text-xs">
                {section.label}
              </h3>
              {!bulkEditAll ? (
                <AdminStockBulkEditBar
                  editActive={sectionEditActive}
                  onEnterEdit={() => onEnterBulkEditSection(section.category, section.products)}
                  onConfirmEdit={onBulkConfirmEdit}
                  onCancelEdit={() => onBulkCancelEdit(section.products)}
                  targets={section.products}
                  selectedCount={selectedInSection.length}
                  allSelected={allInSection}
                  someSelected={someInSection}
                  onToggleSelectAll={() =>
                    onBulkSelectAllInSection(section.products, !allInSection)
                  }
                  onBulkStock={(delta) => onBulkStockDelta(selectedInSection, delta)}
                  onBulkPrice={(delta) => onBulkPriceDelta(selectedInSection, delta)}
                  disabled={bulkActionsDisabled}
                />
              ) : null}
            </div>
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
                    onChangePrice={onChangePrice}
                    onSetPrice={onSetPrice}
                    onEdit={onEdit}
                    onTogglePin={onTogglePin}
                    onDelete={onDelete}
                    onDrop={onDrop}
                    disableReorder={reorderBlocked}
                    autosavePhase={stockAutosaveStatus[product.id]}
                    bulkSelectMode={sectionSelectMode}
                    bulkSelected={bulkSelectedIds.has(product.id)}
                    onBulkSelectChange={(selected) => onBulkSelectToggle(product.id, selected)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
