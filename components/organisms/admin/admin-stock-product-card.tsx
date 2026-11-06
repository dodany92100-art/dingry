"use client";

import { stockIndicativeVariants } from "@/lib/admin/stock-indicative";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/order-view";
import type { AdminProduct } from "@/lib/admin/types";
import { cldOpt } from "@/components/molecules/product-card";
import { AdminStockControls } from "@/components/organisms/admin/admin-stock-controls";
import { AdminStockStatusBadge } from "@/components/organisms/admin/admin-stock-status-badge";
import { AdminProductOrderControls } from "@/components/organisms/admin/admin-product-order-controls";
import { AdminReorderSurface } from "@/components/organisms/admin/admin-reorder-surface";

type AdminStockProductCardProps = {
  product: AdminProduct;
  dragIndex: number;
  busy: boolean;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  onEdit: (product: AdminProduct) => void;
  onTogglePin: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onDrop: (fromIndex: number, toIndex: number) => void;
  disableReorder?: boolean;
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

export function AdminStockProductCard({
  product,
  dragIndex,
  busy,
  onChangeStock,
  onSetStock,
  onEdit,
  onTogglePin,
  onDelete,
  onDrop,
  disableReorder = false,
}: AdminStockProductCardProps) {
  const soldOut = product.stock <= 0;

  return (
    <AdminReorderSurface
      dragIndex={dragIndex}
      busy={busy}
      disabled={disableReorder}
      onDrop={onDrop}
      className={`dingry-admin-stock group ${criticalStockRing(product.stock)}`}
    >
      <div className="w-full rounded-lg md:rounded-xl">
        <div className="dingry-product-photo relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-950 md:rounded-xl">
          <button
            type="button"
            onClick={() => onEdit(product)}
            aria-label={`Modifier ${product.name}`}
            className="absolute inset-0 z-0"
          >
            <img
              src={cldOpt(product.imageUrl, 480)}
              alt=""
              loading="lazy"
              decoding="async"
              width={480}
              height={640}
              className={`h-full w-full object-cover transition-[filter] duration-300 ${soldOut ? "opacity-50" : ""}`}
            />
          </button>
          <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 md:left-2 md:top-2">
            <AdminStockStatusBadge product={product} />
          </div>
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

        <div className="mt-1.5 w-full px-0.5 text-left md:mt-2">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/45 md:text-[10px] md:tracking-[0.22em]">
            {product.name}
          </p>
          <div className="mt-0.5 flex items-start justify-between gap-1.5 md:mt-1">
            <p className="line-clamp-2 min-w-0 text-[10px] font-medium uppercase leading-snug tracking-wide text-neutral-100 md:text-[11px] md:tracking-widest">
              {stockIndicativeVariants(product) || product.category}
            </p>
            <p className="shrink-0 text-[11px] font-bold tabular-nums tracking-tight text-white md:text-sm">
              {priceFormat.format(product.price)}
            </p>
          </div>
        </div>
      </div>

      <AdminStockControls
        product={product}
        busy={busy}
        onChangeStock={onChangeStock}
        onSetStock={onSetStock}
        onEdit={onEdit}
        layout="card"
      />
    </AdminReorderSurface>
  );
}
