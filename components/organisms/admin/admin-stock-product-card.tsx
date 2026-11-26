"use client";

import { useId } from "react";
import { stockIndicativeVariants } from "@/lib/admin/stock-indicative";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/order-view";
import type { StockAutosavePhase } from "@/lib/admin/stock-autosave-types";
import type { AdminProduct } from "@/lib/admin/types";
import { CATALOG_THUMB_IMAGE_WIDTH } from "@/lib/media/catalog-image-sizes";
import { deliveryImageUrl as cldOpt } from "@/lib/media/delivery-image-url";
import {
  AdminStockControls,
  AdminStockQtyControls,
} from "@/components/organisms/admin/admin-stock-controls";
import { AdminStockPriceControls } from "@/components/organisms/admin/admin-price-input";
import { AdminStockStatusBadge } from "@/components/organisms/admin/admin-stock-status-badge";
import { AdminProductOrderControls } from "@/components/organisms/admin/admin-product-order-controls";
import { AdminReorderSurface } from "@/components/organisms/admin/admin-reorder-surface";
import { ProductIdBadge } from "@/components/atoms/product-id-badge";

type AdminStockProductCardProps = {
  product: AdminProduct;
  dragIndex: number;
  busy: boolean;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  onChangePrice?: (product: AdminProduct, delta: number) => void;
  onSetPrice?: (product: AdminProduct, nextPrice: number) => void;
  onEdit: (product: AdminProduct) => void;
  onTogglePin: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onDrop: (fromIndex: number, toIndex: number) => void;
  disableReorder?: boolean;
  autosavePhase?: StockAutosavePhase;
  bulkSelectMode?: boolean;
  bulkSelected?: boolean;
  onBulkSelectChange?: (selected: boolean) => void;
};

const priceFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function criticalStockRing(stock: number): string {
  if (stock <= 0) {
    return "ring-1 ring-red-500/60 shadow-[0_0_16px_rgba(239,68,68,0.22)]";
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return "ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.18)]";
  }
  return "";
}

/** Accent « en ligne » (aligné badge emerald) — sans écraser alerte stock. */
function adminStockCardRing(product: AdminProduct): string {
  const stockRing = criticalStockRing(product.stock);
  if (stockRing) return stockRing;
  if (product.publishStatus === "live") {
    return "ring-1 ring-emerald-500/50 shadow-[0_0_14px_rgba(16,185,129,0.22)]";
  }
  return "";
}

export function AdminStockProductCard({
  product,
  dragIndex,
  busy,
  onChangeStock,
  onSetStock,
  onChangePrice,
  onSetPrice,
  onEdit,
  onTogglePin,
  onDelete,
  onDrop,
  disableReorder = false,
  autosavePhase,
  bulkSelectMode = false,
  bulkSelected = false,
  onBulkSelectChange,
}: AdminStockProductCardProps) {
  const soldOut = product.stock <= 0;
  const variantLine = stockIndicativeVariants(product) || product.category;
  const stockPanelReactId = useId();
  const stockPanelId = `dingry-stock-controls-${product.id}${stockPanelReactId}`;

  return (
    <AdminReorderSurface
      dragIndex={dragIndex}
      busy={busy}
      disabled={disableReorder}
      onDrop={onDrop}
      className={`dingry-admin-stock group flex h-full min-h-0 min-w-0 flex-col rounded-lg md:rounded-xl ${adminStockCardRing(product)}`}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg md:rounded-xl">
        <div className="dingry-product-photo relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-lg bg-zinc-950 md:rounded-xl">
          <button
            type="button"
            onClick={() => onEdit(product)}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={`Modifier ${product.name}`}
            className="absolute inset-0 z-0"
          >
            <img
              src={cldOpt(product.imageUrl, CATALOG_THUMB_IMAGE_WIDTH)}
              alt=""
              loading="lazy"
              decoding="async"
              width={CATALOG_THUMB_IMAGE_WIDTH}
              height={Math.round((CATALOG_THUMB_IMAGE_WIDTH * 4) / 3)}
              className={`h-full w-full object-cover transition-[filter] duration-300 ${soldOut ? "opacity-50" : ""}`}
            />
          </button>
          <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[calc(100%-3rem)] flex-col items-start gap-1">
            <ProductIdBadge id={product.id} />
            {product.isPinned ? (
              <span className="inline-flex max-w-full truncate bg-[#FF3D00]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#FF3D00] ring-1 ring-[#FF3D00]/50">
                Épinglé
              </span>
            ) : null}
            <AdminStockStatusBadge product={product} className="max-w-full truncate max-sm:px-1.5 max-sm:text-[8px] max-sm:tracking-[0.1em]" />
          </div>
          {bulkSelectMode ? (
            <div
              className="absolute bottom-1.5 left-1.5 z-10 rounded-full bg-black/55 p-1 backdrop-blur-[2px]"
              data-admin-no-reorder
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <label className="flex cursor-pointer items-center gap-1 px-1">
                <input
                  type="checkbox"
                  checked={bulkSelected}
                  onChange={(event) => onBulkSelectChange?.(event.target.checked)}
                  className="h-4 w-4 rounded border-white/25 bg-black/50 accent-[#FF3D00]"
                  aria-label={`Sélectionner ${product.name} pour édition en lot`}
                />
              </label>
            </div>
          ) : null}
          <div
            className="absolute right-1 top-1 z-10 flex items-center gap-0.5 rounded-full bg-black/50 p-0.5 backdrop-blur-[2px] md:right-1.5 md:top-1.5"
            data-admin-no-reorder
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <AdminProductOrderControls
              product={product}
              busy={busy}
              layout="card"
              onTogglePin={onTogglePin}
              onDelete={onDelete}
              disableReorder={disableReorder}
              compact
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-1 py-1.5 md:px-1.5 md:py-2">
          <div
            className="min-h-0 space-y-0.5 text-left"
            data-admin-no-reorder
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onEdit(product)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onEdit(product);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Ouvrir la fiche ${product.name}`}
          >
            <p
              className="truncate text-[9px] uppercase tracking-[0.16em] text-white/50 md:text-[10px] md:tracking-[0.2em]"
              title={product.name}
            >
              {product.name}
            </p>
            <p
              className="line-clamp-2 break-words text-[9px] font-medium uppercase leading-snug tracking-wide text-neutral-100 md:text-[10px]"
              title={variantLine}
            >
              {variantLine}
            </p>
          </div>

          <div
            className={`flex min-w-0 pt-0.5 ${bulkSelectMode ? "flex-col gap-1.5" : "items-center justify-between gap-1"}`}
            data-admin-no-reorder
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            {bulkSelectMode && bulkSelected && onChangePrice && onSetPrice ? (
              <AdminStockPriceControls
                product={product}
                disabled={busy}
                onChangePrice={onChangePrice}
                onSetPrice={onSetPrice}
              />
            ) : (
              <p
                className={`shrink-0 text-[11px] font-bold tabular-nums tracking-tight text-white md:text-xs ${
                  bulkSelectMode && !bulkSelected ? "text-white/45" : ""
                }`}
              >
                {priceFormat.format(product.price)}
              </p>
            )}
            <div
              className={
                bulkSelectMode
                  ? "flex w-full min-w-0 justify-end"
                  : "min-w-0 max-w-[62%] shrink"
              }
            >
              <AdminStockQtyControls
                product={product}
                disabled={busy || (bulkSelectMode && !bulkSelected)}
                onChangeStock={onChangeStock}
                onSetStock={onSetStock}
                compact
              />
            </div>
          </div>

          <div className="mt-auto shrink-0 pt-0.5">
            <AdminStockControls
              product={product}
              busy={busy}
              onChangeStock={onChangeStock}
              onSetStock={onSetStock}
              onEdit={onEdit}
              layout="card"
              cardTriggerVariant="inline"
              hideQtyInPanel
              hideEditInPanel
              open
              panelId={stockPanelId}
              autosavePhase={autosavePhase}
            />
          </div>
        </div>
      </div>
    </AdminReorderSurface>
  );
}
