"use client";

import { AdminStockInput } from "@/components/organisms/admin/admin-stock-input";
import type { AdminProduct } from "@/lib/admin/types";

type AdminStockControlsProps = {
  product: AdminProduct;
  busy: boolean;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  onEdit: (product: AdminProduct) => void;
  layout?: "card" | "row";
};

const BTN =
  "flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm text-white/80 shadow-none transition hover:border-[#0066FF]/50 hover:bg-[#0066FF]/15 hover:text-white disabled:opacity-30";
const BTN_COMPACT = `${BTN} h-7 w-7 text-xs`;
const BTN_ROW = `${BTN} h-8 w-8`;
/** Même libellé et style que la vue liste (layout row). */
const BTN_EDIT_ROW =
  "ml-1 h-8 shrink-0 rounded-full px-3 text-[10px] uppercase tracking-[0.12em] text-white/55 transition hover:bg-white/10 hover:text-white";
const BTN_EDIT_CARD =
  "ml-0.5 h-7 shrink-0 rounded-full px-2.5 text-[10px] uppercase tracking-[0.12em] text-white/55 transition hover:bg-white/10 hover:text-white md:h-8 md:px-3";

export function AdminStockControls({
  product,
  busy,
  onChangeStock,
  onSetStock,
  onEdit,
  layout = "card",
}: AdminStockControlsProps) {
  const disabled = busy;

  if (layout === "row") {
    return (
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2" data-admin-no-reorder>
        <button
          type="button"
          disabled={disabled || product.stock === 0}
          onClick={() => onChangeStock(product, -1)}
          className={BTN_ROW}
          aria-label={`Retirer un ${product.name}`}
        >
          −
        </button>
        <AdminStockInput
          product={product}
          disabled={disabled}
          onSetStock={onSetStock}
          className="h-8 w-16 rounded-full border-white/10 bg-white/[0.04] text-center"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChangeStock(product, 1)}
          className={BTN_ROW}
          aria-label={`Ajouter un ${product.name}`}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onEdit(product)}
          className={BTN_EDIT_ROW}
        >
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex w-full min-w-0 flex-col gap-1 border-t border-white/[0.06] pt-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-0.5"
      data-admin-no-reorder
    >
      <div className="flex min-w-0 items-center justify-center gap-0.5">
        <button
          type="button"
          disabled={disabled || product.stock === 0}
          onClick={() => onChangeStock(product, -1)}
          className={BTN_COMPACT}
          aria-label={`Retirer un ${product.name}`}
        >
          −
        </button>
        <AdminStockInput
          product={product}
          disabled={disabled}
          onSetStock={onSetStock}
          className="h-7 w-12 min-w-0 max-w-[3.25rem] flex-1 rounded-full border-white/10 bg-white/[0.04] text-center text-xs tabular-nums sm:w-14 sm:max-w-none sm:flex-none"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChangeStock(product, 1)}
          className={BTN_COMPACT}
          aria-label={`Ajouter un ${product.name}`}
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => onEdit(product)}
        className={`${BTN_EDIT_CARD} w-full sm:ml-0.5 sm:w-auto`}
      >
        Modifier
      </button>
    </div>
  );
}
