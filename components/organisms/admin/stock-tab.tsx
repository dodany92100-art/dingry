"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { BulkEditSnapshotRow } from "@/components/organisms/admin/hooks/use-admin-products";
import { AdminStockBulkEditBar } from "@/components/organisms/admin/admin-stock-bulk-edit-bar";
import { sumProductStock } from "@/lib/admin/order-view";
import type { AdminProduct } from "@/lib/admin/types";
import type { CatalogCategory } from "@/lib/catalog-category";
import { normalizeProductCategory } from "@/lib/admin/types";
import { AdminStockPublishToggle } from "@/components/organisms/admin/admin-stock-publish-toggle";
import { AdminStockColorSortToggle } from "@/components/organisms/admin/admin-stock-color-sort-toggle";
import { AdminStockStickyFilters } from "@/components/organisms/admin/admin-stock-sticky-filters";
import type { TabId } from "@/components/organisms/admin/tab-nav";
import { AdminStockListRow } from "@/components/organisms/admin/admin-stock-list-row";
import { AdminStockProductCard } from "@/components/organisms/admin/admin-stock-product-card";
import type { AdminStockViewMode } from "@/components/organisms/admin/admin-stock-view-toggle";
import {
  catalogSlugForAdminProduct,
  sortAdminProductsLikeShop,
} from "@/lib/admin/product-display-order";
import {
  adminStockCatalogCards,
  buildAdminStockMenuSections,
} from "@/lib/admin/stock-menu-sections";
import { AdminStockSectionsGrid } from "@/components/organisms/admin/admin-stock-sections-grid";
import { AdminStockStorefrontPreview } from "@/components/organisms/admin/admin-stock-storefront-preview";
import { ADMIN_STOCK_PRODUCT_GRID_CLASS } from "@/components/organisms/shop/catalog-layout";
import type { StockAutosaveStatusMap } from "@/lib/admin/stock-autosave-types";
import {
  sortProductsByColorLuminance,
  type StockColorSortMode,
} from "@/lib/admin/stock-color-luminance";
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
  onConfirmStockPending?: () => Promise<void>;
  onRevertBulkEditSession?: (
    snapshot: Record<string, BulkEditSnapshotRow>,
    scope: readonly AdminProduct[],
  ) => Promise<void>;
  onChangePrice: (product: AdminProduct, delta: number) => void;
  onSetPrice: (product: AdminProduct, nextPrice: number) => void;
  onEdit: (product: AdminProduct) => void;
  onNew: () => void;
  onTogglePin: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onReorderProducts: (orderedIds: string[]) => void;
  /** Modale fiche ouverte : pas de ± stock (évite conflit Blob avec la sauvegarde). */
  productEditorOpen?: boolean;
  stockAutosaveStatus?: StockAutosaveStatusMap;
  categoryFilter: AdminProductCategoryFilter;
  onCategoryFilterChange: (filter: AdminProductCategoryFilter) => void;
  onUnauthorized?: () => void;
  viewMode: AdminStockViewMode;
  onViewModeChange: (mode: AdminStockViewMode) => void;
  storefrontPreview: boolean;
  onStorefrontPreviewChange: (active: boolean) => void;
  /** Sélecteur Stock/Brouillons + catégorie (&lt; 450px). */
  mobileContextSlot?: ReactNode;
  /** CRM | SITE — bas gauche de la plaque filtres (mobile). */
  mobileToolbarSlot?: ReactNode;
  /** Aperçu + grille/liste dans la barre sticky (md+). */
  desktopToolbarSlot?: ReactNode;
  stockContextTab: "produits" | "brouillons";
  onStockContextTabChange: (tab: TabId) => void;
  /** Enregistrement direct de l’ordre affiché (tri luminosité, etc.). */
  onCommitProductOrder?: (orderedIds: readonly string[]) => Promise<boolean>;
  orderSaving?: boolean;
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

function productMatchesStockSearch(product: AdminProduct, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const categoryNorm = normalizeProductCategory(product.category);
  const fields = [
    product.id,
    product.sku,
    product.name,
    product.variant,
    product.category,
    categoryNorm,
    product.description,
    ...product.colorDeclinations,
  ];
  return fields.some((field) => String(field).toLowerCase().includes(q));
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
  onConfirmStockPending,
  onRevertBulkEditSession,
  onChangePrice,
  onSetPrice,
  onEdit,
  onNew,
  onTogglePin,
  onDelete,
  onReorderProducts,
  productEditorOpen = false,
  stockAutosaveStatus = {},
  categoryFilter,
  onCategoryFilterChange,
  onUnauthorized,
  viewMode,
  storefrontPreview,
  onStorefrontPreviewChange,
  mobileContextSlot,
  mobileToolbarSlot,
  desktopToolbarSlot,
  stockContextTab,
  onStockContextTabChange,
  onCommitProductOrder,
  orderSaving = false,
}: StockTabProps) {
  const stockControlsBusy = productEditorOpen;
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [colorSortMode, setColorSortMode] = useState<StockColorSortMode>("default");
  const [bulkEditAll, setBulkEditAll] = useState(false);
  const [bulkEditSection, setBulkEditSection] = useState<CatalogCategory | null>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(() => new Set());
  const bulkEditSnapshotRef = useRef<Record<string, BulkEditSnapshotRow> | null>(null);

  const captureBulkEditSnapshot = useCallback((targets: readonly AdminProduct[]) => {
    const snapshot: Record<string, BulkEditSnapshotRow> = {};
    for (const product of targets) {
      snapshot[product.id] = { stock: product.stock, price: product.price };
    }
    bulkEditSnapshotRef.current = snapshot;
  }, []);

  useEffect(() => {
    bulkEditSnapshotRef.current = null;
    setBulkEditAll(false);
    setBulkEditSection(null);
    setBulkSelectedIds(new Set());
  }, [categoryFilter, searchQuery]);

  const applyBulkStockDelta = useCallback(
    (targets: readonly AdminProduct[], delta: number) => {
      for (const product of targets) {
        if (product.stock + delta < 0) continue;
        onChangeStock(product, delta);
      }
    },
    [onChangeStock],
  );

  const applyBulkPriceDelta = useCallback(
    (targets: readonly AdminProduct[], delta: number) => {
      for (const product of targets) {
        const next = product.price + delta;
        if (next <= 0 || next > 10_000) continue;
        void onChangePrice(product, delta);
      }
    },
    [onChangePrice],
  );

  const onBulkSelectToggle = useCallback((productId: string, selected: boolean) => {
    setBulkSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const onBulkSelectAllInTargets = useCallback((targets: readonly AdminProduct[], selected: boolean) => {
    setBulkSelectedIds((current) => {
      const next = new Set(current);
      for (const product of targets) {
        if (selected) next.add(product.id);
        else next.delete(product.id);
      }
      return next;
    });
  }, []);

  const closeBulkEdit = useCallback(() => {
    bulkEditSnapshotRef.current = null;
    setBulkEditAll(false);
    setBulkEditSection(null);
    setBulkSelectedIds(new Set());
  }, []);

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

  const searchFiltered = useMemo(
    () => baseFiltered.filter((product) => productMatchesStockSearch(product, searchQuery)),
    [baseFiltered, searchQuery],
  );

  const menuSections = useMemo(() => {
    if (categoryFilter !== "Collection") return null;
    const sections = buildAdminStockMenuSections(searchFiltered);
    if (colorSortMode === "default") return sections;
    return sections.map((section) => ({
      ...section,
      products: sortProductsByColorLuminance(section.products, colorSortMode),
    }));
  }, [searchFiltered, categoryFilter, colorSortMode]);

  const visibleProducts = useMemo(() => {
    if (menuSections) return menuSections.flatMap((section) => section.products);
    const base = sortAdminProductsLikeShop(searchFiltered);
    if (colorSortMode === "default") return base;
    return sortProductsByColorLuminance(base, colorSortMode);
  }, [searchFiltered, menuSections, colorSortMode]);

  const enterBulkEditAll = useCallback(() => {
    captureBulkEditSnapshot(visibleProducts);
    setBulkEditAll(true);
    setBulkEditSection(null);
    setBulkSelectedIds(new Set());
  }, [captureBulkEditSnapshot, visibleProducts]);

  const enterBulkEditSection = useCallback(
    (category: CatalogCategory, targets: readonly AdminProduct[]) => {
      captureBulkEditSnapshot(targets);
      setBulkEditSection(category);
      setBulkEditAll(false);
      setBulkSelectedIds(new Set());
    },
    [captureBulkEditSnapshot],
  );

  const confirmBulkEdit = useCallback(async () => {
    if (onConfirmStockPending) await onConfirmStockPending();
    closeBulkEdit();
  }, [closeBulkEdit, onConfirmStockPending]);

  const cancelBulkEdit = useCallback(
    (scope: readonly AdminProduct[]) => {
      const snapshot = bulkEditSnapshotRef.current;
      if (snapshot && onRevertBulkEditSession) {
        void onRevertBulkEditSession(snapshot, scope);
      }
      closeBulkEdit();
    },
    [closeBulkEdit, onRevertBulkEditSession],
  );

  const bulkEditActive = bulkEditAll || bulkEditSection !== null;

  const selectedBulkProducts = useMemo(
    () => visibleProducts.filter((product) => bulkSelectedIds.has(product.id)),
    [visibleProducts, bulkSelectedIds],
  );

  const shouldApplyToBulkSelection = useCallback(
    (product: AdminProduct) =>
      bulkEditActive && bulkSelectedIds.has(product.id) && bulkSelectedIds.size > 1,
    [bulkEditActive, bulkSelectedIds],
  );

  const changeStockForCard = useCallback(
    (product: AdminProduct, delta: number) => {
      if (shouldApplyToBulkSelection(product)) {
        applyBulkStockDelta(selectedBulkProducts, delta);
        return;
      }
      onChangeStock(product, delta);
    },
    [shouldApplyToBulkSelection, selectedBulkProducts, applyBulkStockDelta, onChangeStock],
  );

  const setStockForCard = useCallback(
    (product: AdminProduct, nextStock: number) => {
      if (shouldApplyToBulkSelection(product)) {
        for (const target of selectedBulkProducts) {
          onSetStock(target, nextStock);
        }
        return;
      }
      onSetStock(product, nextStock);
    },
    [shouldApplyToBulkSelection, selectedBulkProducts, onSetStock],
  );

  const changePriceForCard = useCallback(
    (product: AdminProduct, delta: number) => {
      if (shouldApplyToBulkSelection(product)) {
        applyBulkPriceDelta(selectedBulkProducts, delta);
        return;
      }
      void onChangePrice(product, delta);
    },
    [shouldApplyToBulkSelection, selectedBulkProducts, applyBulkPriceDelta, onChangePrice],
  );

  const setPriceForCard = useCallback(
    (product: AdminProduct, nextPrice: number) => {
      if (shouldApplyToBulkSelection(product)) {
        for (const target of selectedBulkProducts) {
          void onSetPrice(target, nextPrice);
        }
        return;
      }
      void onSetPrice(product, nextPrice);
    },
    [shouldApplyToBulkSelection, selectedBulkProducts, onSetPrice],
  );

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

  const reorderBlocked = gridLocked || storefrontPreview || colorSortMode !== "default";

  const validateColorSortDisabled =
    storefrontPreview || !onCommitProductOrder || visibleProducts.length < 2;

  const handleValidateColorSort = () => {
    if (validateColorSortDisabled || colorSortMode === "default" || orderSaving) return;
    void onCommitProductOrder?.(visibleProducts.map((product) => product.id)).then((ok) => {
      if (ok) setColorSortMode("default");
    });
  };

  const moveProduct = (fromIndex: number, toIndex: number) => {
    if (reorderBlocked) return;
    if (fromIndex === toIndex) return;
    const moved = visibleProducts[fromIndex];
    const target = visibleProducts[toIndex];
    if (!moved || !target) return;
    const movedSlug = catalogSlugForAdminProduct(moved);
    const targetSlug = catalogSlugForAdminProduct(target);
    if (!movedSlug || !targetSlug || movedSlug !== targetSlug) return;
    const next = [...visibleProducts];
    const [spliced] = next.splice(fromIndex, 1);
    if (!spliced) return;
    next.splice(toIndex, 0, spliced);
    onReorderProducts(next.map((item) => item.id));
  };

  const totalStock = sumProductStock(visibleProducts);
  const draftCount = visibleProducts.filter((p) => p.publishStatus === "draft").length;
  const liveCount = visibleProducts.length - draftCount;

  return (
    <div className="pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]">
      <AdminStockStickyFilters
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryFilterChange}
        mobileContextSlot={mobileContextSlot}
      >
        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-nowrap md:items-center md:justify-start md:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5 md:flex-none">
            <AdminStockPublishToggle tab={stockContextTab} onChange={onStockContextTabChange} />
            <div className="dingry-admin-track-linear flex h-8 w-full min-w-0 items-center gap-2 rounded-full px-2.5 py-0 transition-[border-color,box-shadow] duration-200 focus-within:border-white/14 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] min-[450px]:h-9 min-[450px]:px-3 sm:min-w-[12rem] sm:flex-1 sm:max-w-md md:w-52 md:flex-none lg:w-60">
              <label htmlFor="dingry-admin-stock-search" className="sr-only">
                Rechercher un produit
              </label>
              <input
                id="dingry-admin-stock-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher…"
                title="Nom, SKU, id, variante…"
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent py-0 text-[10px] tracking-[0.08em] text-white placeholder:text-white/35 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex w-full min-w-0 items-center justify-between gap-2 md:w-auto md:flex-1 md:justify-end md:gap-2.5">
            {mobileToolbarSlot ? (
              <div className="flex shrink-0 items-center md:hidden">{mobileToolbarSlot}</div>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center justify-end gap-2 md:ml-0 md:gap-2.5">
              <AdminStockColorSortToggle
                mode={colorSortMode}
                onChange={setColorSortMode}
                onValidate={handleValidateColorSort}
                validateBusy={orderSaving}
                validateDisabled={validateColorSortDisabled}
              />
              {desktopToolbarSlot ? (
                <div className="hidden items-center gap-2.5 md:flex">{desktopToolbarSlot}</div>
              ) : null}
            </div>
          </div>
        </div>
      </AdminStockStickyFilters>

      <div className="mb-4 mt-3 min-w-0">
        <div>
          <p className="hidden text-[10px] uppercase tracking-[0.22em] text-white/40 sm:block">
            {publishFilter === "draft" ? "Brouillons" : "Stock"}
            {categoryFilter !== "Collection" ? (
              <span className="text-white/30"> · {categoryFilter}</span>
            ) : null}
          </p>
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
          ) : baseFiltered.length > 0 && searchQuery.trim() !== "" ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/40">
              Aucun produit ne correspond à la recherche.
            </p>
          ) : products.length > 0 ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/40">
              Aucun produit dans cette catégorie.
            </p>
          ) : null}
        </div>
      </div>
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

      {!storefrontPreview && visibleProducts.length > 0 && viewMode === "grid" ? (
        <div className="mb-4">
          <AdminStockBulkEditBar
            editActive={bulkEditAll}
            onEnterEdit={enterBulkEditAll}
            onConfirmEdit={() => void confirmBulkEdit()}
            onCancelEdit={() => cancelBulkEdit(visibleProducts)}
            targets={visibleProducts}
            selectedCount={visibleProducts.filter((p) => bulkSelectedIds.has(p.id)).length}
            allSelected={
              visibleProducts.length > 0 &&
              visibleProducts.every((p) => bulkSelectedIds.has(p.id))
            }
            someSelected={
              visibleProducts.some((p) => bulkSelectedIds.has(p.id)) &&
              !visibleProducts.every((p) => bulkSelectedIds.has(p.id))
            }
            onToggleSelectAll={() =>
              onBulkSelectAllInTargets(
                visibleProducts,
                !visibleProducts.every((p) => bulkSelectedIds.has(p.id)),
              )
            }
            onBulkStock={(delta) =>
              applyBulkStockDelta(
                visibleProducts.filter((p) => bulkSelectedIds.has(p.id)),
                delta,
              )
            }
            onBulkPrice={(delta) =>
              applyBulkPriceDelta(
                visibleProducts.filter((p) => bulkSelectedIds.has(p.id)),
                delta,
              )
            }
            disabled={stockControlsBusy}
          />
        </div>
      ) : null}

      {storefrontPreview ? (
        <AdminStockStorefrontPreview
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          onUnauthorized={onUnauthorized}
        />
      ) : visibleProducts.length === 0 ? (
        <p className="rounded-sm border border-zinc-800 bg-zinc-900/50 px-4 py-10 text-center text-sm text-white/40">
          {products.length === 0
            ? "Aucun produit."
            : baseFiltered.length > 0 && searchQuery.trim() !== ""
              ? "Aucun produit ne correspond à la recherche."
              : "Aucun produit dans cette catégorie."}
        </p>
      ) : viewMode === "grid" ? (
        menuSections ? (
          <AdminStockSectionsGrid
            sections={menuSections}
            indexByProductId={indexByProductId}
            busyProductId={busyProductId}
            reorderBlocked={reorderBlocked}
            onChangeStock={changeStockForCard}
            onSetStock={setStockForCard}
            onChangePrice={changePriceForCard}
            onSetPrice={setPriceForCard}
            onEdit={onEdit}
            onTogglePin={onTogglePin}
            onDelete={setPendingDelete}
            onDrop={moveProduct}
            stockAutosaveStatus={stockAutosaveStatus}
            bulkEditAll={bulkEditAll}
            bulkEditSection={bulkEditSection}
            bulkSelectedIds={bulkSelectedIds}
            onEnterBulkEditSection={enterBulkEditSection}
            onBulkSelectToggle={onBulkSelectToggle}
            onBulkSelectAllInSection={onBulkSelectAllInTargets}
            onBulkStockDelta={applyBulkStockDelta}
            onBulkPriceDelta={applyBulkPriceDelta}
            onBulkConfirmEdit={() => void confirmBulkEdit()}
            onBulkCancelEdit={cancelBulkEdit}
            bulkActionsDisabled={stockControlsBusy}
          />
        ) : (
          <div className={ADMIN_STOCK_PRODUCT_GRID_CLASS}>
            {visibleProducts.map((product, index) => (
              <AdminStockProductCard
                key={product.id}
                product={product}
                dragIndex={index}
                busy={stockControlsBusy || busyProductId === product.id}
                onChangeStock={changeStockForCard}
                onSetStock={setStockForCard}
                onChangePrice={changePriceForCard}
                onSetPrice={setPriceForCard}
                onEdit={onEdit}
                onTogglePin={onTogglePin}
                onDelete={setPendingDelete}
                onDrop={moveProduct}
                disableReorder={reorderBlocked}
                autosavePhase={stockAutosaveStatus[product.id]}
                bulkSelectMode={bulkEditAll}
                bulkSelected={bulkSelectedIds.has(product.id)}
                onBulkSelectChange={(selected) => onBulkSelectToggle(product.id, selected)}
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
                        busy={stockControlsBusy || busyProductId === product.id}
                        onChangeStock={onChangeStock}
                        onSetStock={onSetStock}
                        onEdit={onEdit}
                        onTogglePin={onTogglePin}
                        onDrop={moveProduct}
                        disableReorder={reorderBlocked}
                        autosavePhase={stockAutosaveStatus[product.id]}
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
                  busy={stockControlsBusy || busyProductId === product.id}
                  onChangeStock={onChangeStock}
                  onSetStock={onSetStock}
                  onEdit={onEdit}
                  onTogglePin={onTogglePin}
                  onDrop={moveProduct}
                  disableReorder={reorderBlocked}
                  autosavePhase={stockAutosaveStatus[product.id]}
                />
              ))}
        </div>
      )}
      <button
        type="button"
        onClick={onNew}
        className="dingry-gold-pill-btn dingry-admin-new-product-btn dingry-admin-new-product-fab fixed right-4 z-[92] h-10 rounded-full px-5 text-[11px] uppercase tracking-[0.12em] shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm bottom-[calc(3.65rem+env(safe-area-inset-bottom,0px))] md:right-6 md:bottom-[4.75rem]"
        aria-label="Créer un nouveau produit"
      >
        <span className="gold-text">Nouveau</span>
      </button>
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
              <span className="uppercase tracking-[0.12em] text-[#ff8a4d]">
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