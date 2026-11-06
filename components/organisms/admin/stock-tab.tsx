"use client";

import { useEffect, useMemo, useState } from "react";
import { sumProductStock } from "@/lib/admin/order-view";
import type { AdminProduct } from "@/lib/admin/types";
import { normalizeProductCategory } from "@/lib/admin/types";
import { AdminCategoryFilterNav } from "@/components/organisms/admin/admin-category-filter-nav";
import { AdminStockListRow } from "@/components/organisms/admin/admin-stock-list-row";
import { AdminStockProductCard } from "@/components/organisms/admin/admin-stock-product-card";
import {
  AdminStockViewToggle,
  type AdminStockViewMode,
} from "@/components/organisms/admin/admin-stock-view-toggle";
import { sortAdminProductsLikeShop } from "@/lib/admin/product-display-order";
import {
  adminStockCatalogCards,
  buildAdminStockMenuSections,
} from "@/lib/admin/stock-menu-sections";
import { AdminStockSectionsGrid } from "@/components/organisms/admin/admin-stock-sections-grid";
import { AdminStockPreviewToggle } from "@/components/organisms/admin/admin-stock-preview-toggle";
import { AdminStockStorefrontPreview } from "@/components/organisms/admin/admin-stock-storefront-preview";
import { CATALOG_PRODUCT_GRID_CLASS } from "@/components/organisms/shop/catalog-layout";
import type { AdminProductCategoryFilter } from "@/lib/shop-data";

type StockTabProps = {
  products: AdminProduct[];
  busyProductId: string | null;
  error: string;
  /** `live` = onglet Stock · `draft` = onglet Brouillons */
  publishFilter?: "live" | "draft";
  gridLocked?: boolean;
  onVisibleDraftIdsChange?: (ids: string[]) => void;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  onEdit: (product: AdminProduct) => void;
  onNew: () => void;
  onTogglePin: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onReorderProducts: (orderedIds: string[]) => void;
};

function filterByAdminCategory(
  products: AdminProduct[],
  filter: AdminProductCategoryFilter,
): AdminProduct[] {
  if (filter === "Collection") return products;
  return products.filter((product) => normalizeProductCategory(product.category) === filter);
}

/** CRM stock : cartes alignées vitrine (delegué à stock-menu-sections). */
function hideCrewneckVersoFromAdminStock(products: AdminProduct[]): AdminProduct[] {
  return adminStockCatalogCards(products);
}

function filterByPublishStatus(products: AdminProduct[], publishFilter: "live" | "draft"): AdminProduct[] {
  return products.filter((product) => product.publishStatus === publishFilter);
}

export function StockTab({
  products,
  busyProductId,
  error,
  publishFilter = "live",
  gridLocked = false,
  onVisibleDraftIdsChange,
  onChangeStock,
  onSetStock,
  onEdit,
  onNew,
  onTogglePin,
  onDelete,
  onReorderProducts,
}: StockTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<AdminProductCategoryFilter>("Collection");
  const [viewMode, setViewMode] = useState<AdminStockViewMode>("grid");
  const [storefrontPreview, setStorefrontPreview] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);

  const catalogCardProducts = useMemo(
    () => hideCrewneckVersoFromAdminStock(products),
    [products],
  );

  const baseFiltered = useMemo(
    () =>
      filterByAdminCategory(
        filterByPublishStatus(hideCrewneckVersoFromAdminStock(products), publishFilter),
        categoryFilter,
      ),
    [products, categoryFilter, publishFilter],
  );

  const menuSections = useMemo(
    () => (categoryFilter === "Collection" ? buildAdminStockMenuSections(baseFiltered) : null),
    [baseFiltered, categoryFilter],
  );

  const visibleProducts = useMemo(() => {
    if (menuSections) return menuSections.flatMap((section) => section.products);
    return sortAdminProductsLikeShop(baseFiltered);
  }, [baseFiltered, menuSections]);

  const indexByProductId = useMemo(() => {
    const map = new Map<string, number>();
    visibleProducts.forEach((product, index) => map.set(product.id, index));
    return map;
  }, [visibleProducts]);

  useEffect(() => {
    if (!onVisibleDraftIdsChange) return;
    onVisibleDraftIdsChange(
      visibleProducts.filter((product) => product.publishStatus === "draft").map((product) => product.id),
    );
  }, [onVisibleDraftIdsChange, visibleProducts]);

  const reorderBlocked = gridLocked || storefrontPreview;

  const moveProduct = (fromIndex: number, toIndex: number) => {
    if (reorderBlocked) return;
    if (fromIndex === toIndex) return;
    const next = [...visibleProducts];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    onReorderProducts(next.map((item) => item.id));
  };

  const totalStock = sumProductStock(visibleProducts);
  const draftCount = visibleProducts.filter((p) => p.publishStatus === "draft").length;
  const liveCount = visibleProducts.length - draftCount;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <AdminCategoryFilterNav selected={categoryFilter} onChange={setCategoryFilter} />
          <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
            {categoryFilter === "Collection"
              ? "Familles · même ordre que le menu boutique (Hoodies → Caps)"
              : "Ordre boutique · Sélection (épinglé → displayOrder → date)"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AdminStockPreviewToggle active={storefrontPreview} onChange={setStorefrontPreview} />
          {!storefrontPreview ? <AdminStockViewToggle mode={viewMode} onChange={setViewMode} /> : null}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
            {publishFilter === "draft" ? "Brouillons" : "Stock"}
          </p>
          <p className="mt-1 max-w-md text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
            Une quantité par fiche produit, partagée entre toutes les tailles. Glissez une carte (ou
            maintenez appuyé sur mobile) · validez la grille · publiez la sélection depuis la barre en bas.
          </p>
          {categoryFilter !== "Collection" ? (
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
              Catégorie · {categoryFilter}
            </p>
          ) : null}
          {visibleProducts.length > 0 ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
              Total pièces · <span className="tabular-nums text-white">{totalStock}</span>
              {publishFilter === "live" ? (
                <>
                  <span className="mx-2 text-white/25">·</span>
                  {liveCount} en ligne
                </>
              ) : (
                <>
                  <span className="mx-2 text-white/25">·</span>
                  {draftCount} brouillon{draftCount > 1 ? "s" : ""}
                </>
              )}
            </p>
          ) : products.length > 0 ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/40">
              Aucun produit dans cette catégorie.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onNew}
          className="h-9 shrink-0 border border-[#0066FF] bg-[#0066FF] px-3 text-[11px] uppercase tracking-[0.18em] text-white transition hover:border-[#0052cc] hover:bg-[#0052cc]"
        >
          Nouveau
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

      {storefrontPreview ? (
        <AdminStockStorefrontPreview products={catalogCardProducts} categoryFilter={categoryFilter} />
      ) : visibleProducts.length === 0 ? (
        <p className="rounded-sm border border-zinc-800 bg-zinc-900/50 px-4 py-10 text-center text-sm text-white/40">
          {products.length === 0 ? "Aucun produit." : "Aucun produit dans cette catégorie."}
        </p>
      ) : viewMode === "grid" ? (
        menuSections ? (
          <AdminStockSectionsGrid
            sections={menuSections}
            indexByProductId={indexByProductId}
            busyProductId={busyProductId}
            reorderBlocked={reorderBlocked}
            onChangeStock={onChangeStock}
            onSetStock={onSetStock}
            onEdit={onEdit}
            onTogglePin={onTogglePin}
            onDelete={setPendingDelete}
            onDrop={moveProduct}
          />
        ) : (
          <div className={CATALOG_PRODUCT_GRID_CLASS}>
            {visibleProducts.map((product, index) => (
              <AdminStockProductCard
                key={product.id}
                product={product}
                dragIndex={index}
                busy={busyProductId === product.id}
                onChangeStock={onChangeStock}
                onSetStock={onSetStock}
                onEdit={onEdit}
                onTogglePin={onTogglePin}
                onDelete={setPendingDelete}
                onDrop={moveProduct}
                disableReorder={reorderBlocked}
              />
            ))}
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900/40">
          {menuSections
            ? menuSections.map((section) => (
                <div key={section.category}>
                  <p className="border-b border-zinc-800 bg-zinc-950/80 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-white/70">
                    {section.label}
                  </p>
                  {section.products.map((product) => {
                    const dragIndex = indexByProductId.get(product.id);
                    if (dragIndex === undefined) return null;
                    return (
                      <AdminStockListRow
                        key={product.id}
                        product={product}
                        dragIndex={dragIndex}
                        busy={busyProductId === product.id}
                        onChangeStock={onChangeStock}
                        onSetStock={onSetStock}
                        onEdit={onEdit}
                        onTogglePin={onTogglePin}
                        onDrop={moveProduct}
                        disableReorder={reorderBlocked}
                      />
                    );
                  })}
                </div>
              ))
            : visibleProducts.map((product, index) => (
                <AdminStockListRow
                  key={product.id}
                  product={product}
                  dragIndex={index}
                  busy={busyProductId === product.id}
                  onChangeStock={onChangeStock}
                  onSetStock={onSetStock}
                  onEdit={onEdit}
                  onTogglePin={onTogglePin}
                  onDrop={moveProduct}
                  disableReorder={reorderBlocked}
                />
              ))}
        </div>
      )}
      {pendingDelete ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dingry-delete-title"
        >
          <div className="w-full max-w-sm border border-zinc-700 bg-[#111] p-5">
            <p id="dingry-delete-title" className="text-sm font-medium uppercase tracking-[0.16em] text-white">
              Supprimer ce produit ?
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              <span className="text-white">{pendingDelete.name}</span>
              <span className="text-white/40"> · </span>
              <span className="uppercase tracking-[0.12em] text-[#7EB3FF]">
                {pendingDelete.category}
              </span>
              {pendingDelete.variant ? (
                <>
                  <span className="text-white/40"> · </span>
                  {pendingDelete.variant}
                </>
              ) : null}
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-red-400/80">
              Action définitive · hors collection
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="h-10 flex-1 rounded-full border border-white/15 text-[10px] uppercase tracking-[0.16em] text-white/70 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const product = pendingDelete;
                  setPendingDelete(null);
                  onDelete(product);
                }}
                className="h-10 flex-1 rounded-full bg-red-600 text-[10px] uppercase tracking-[0.16em] text-white hover:bg-red-500"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}