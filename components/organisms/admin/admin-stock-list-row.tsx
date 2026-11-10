"use client";

import { adminStockIdLabel } from "@/lib/admin/format";
import { stockIndicativeVariants } from "@/lib/admin/stock-indicative";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/order-view";
import type { StockAutosavePhase } from "@/lib/admin/stock-autosave-types";
import type { AdminProduct } from "@/lib/admin/types";
import { deliveryImageUrl as cldOpt } from "@/lib/media/delivery-image-url";
import { AdminStockControls } from "@/components/organisms/admin/admin-stock-controls";
import { AdminStockStatusBadge } from "@/components/organisms/admin/admin-stock-status-badge";
import { AdminProductOrderControls } from "@/components/organisms/admin/admin-product-order-controls";
import { AdminReorderSurface } from "@/components/organisms/admin/admin-reorder-surface";

type AdminStockListRowProps = {
  product: AdminProduct;
  dragIndex: number;
  busy: boolean;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  onEdit: (product: AdminProduct) => void;
  onTogglePin: (product: AdminProduct) => void;
  onDrop: (fromIndex: number, toIndex: number) => void;
  disableReorder?: boolean;
  autosavePhase?: StockAutosavePhase;
};

function rowCriticalClass(stock: number, publishStatus: AdminProduct["publishStatus"]): string {
  if (stock <= 0) return "border-l-2 border-l-red-500/70 bg-red-950/10";
  if (stock <= LOW_STOCK_THRESHOLD) return "border-l-2 border-l-amber-400/60 bg-amber-950/10";
  if (publishStatus === "live") return "border-l-2 border-l-emerald-500/70 bg-emerald-950/10";
  return "border-l-2 border-l-transparent";
}

export function AdminStockListRow({
  product,
  dragIndex,
  busy,
  onChangeStock,
  onSetStock,
  onEdit,
  onTogglePin,
  onDrop,
  disableReorder = false,
  autosavePhase,
}: AdminStockListRowProps) {
  return (
    <AdminReorderSurface
      dragIndex={dragIndex}
      busy={busy}
      disabled={disableReorder}
      onDrop={onDrop}
      className={`dingry-admin-stock flex flex-col gap-3 border-b border-zinc-800 px-3 py-3 last:border-b-0 sm:flex-row sm:items-center md:gap-4 md:px-4 ${rowCriticalClass(product.stock, product.publishStatus)}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <AdminProductOrderControls
          product={product}
          busy={busy}
          layout="row"
          onTogglePin={onTogglePin}
          disableReorder={disableReorder}
        />
        <button
          type="button"
          onClick={() => onEdit(product)}
          aria-label={`Modifier ${product.name}`}
          className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-zinc-800 bg-zinc-950 transition hover:border-zinc-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 sm:h-14 sm:w-14"
        >
          <img
            src={cldOpt(product.imageUrl, 112)}
            alt=""
            width={112}
            height={112}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className="font-mono text-[10px] font-bold leading-none tracking-[0.08em] text-white/90 ring-1 ring-white/15 bg-zinc-950/90 px-1.5 py-1 rounded-sm"
              title={`Id catalogue ${product.id}`}
            >
              {adminStockIdLabel(product.id)}
            </span>
            <AdminStockStatusBadge product={product} />
            <span className="text-[9px] uppercase tracking-[0.16em] text-zinc-500">{product.category}</span>
          </div>
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-white">{product.name}</p>
          {stockIndicativeVariants(product) ? (
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-300">
              {stockIndicativeVariants(product)}
            </p>
          ) : null}
          {product.price > 0 ? (
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-zinc-400">{product.price} €</p>
          ) : null}
        </div>
      </div>

      <AdminStockControls
        product={product}
        busy={busy}
        onChangeStock={onChangeStock}
        onSetStock={onSetStock}
        onEdit={onEdit}
        layout="row"
        autosavePhase={autosavePhase}
      />
    </AdminReorderSurface>
  );
}
