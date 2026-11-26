"use client";

import { Pencil } from "lucide-react";
import type { AdminProduct } from "@/lib/admin/types";

type AdminStockBulkEditBarProps = {
  editActive: boolean;
  onEnterEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  targets: readonly AdminProduct[];
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelectAll: () => void;
  onBulkStock: (delta: number) => void;
  onBulkPrice: (delta: number) => void;
  disabled?: boolean;
};

const CHIP =
  "dingry-admin-track-linear h-8 shrink-0 rounded-full border border-white/12 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white/85 transition hover:border-white/25 disabled:opacity-35";

const CHIP_MUTED =
  "dingry-admin-track-linear h-8 shrink-0 rounded-full border border-white/12 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 disabled:opacity-35";

const CHIP_CONFIRM =
  "dingry-admin-track-linear h-8 shrink-0 rounded-full border border-[#FF3D00]/45 bg-[#FF3D00]/12 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:border-[#FF3D00]/60 disabled:opacity-35";

export function AdminStockBulkEditBar({
  editActive,
  onEnterEdit,
  onConfirmEdit,
  onCancelEdit,
  targets,
  selectedCount,
  allSelected,
  someSelected,
  onToggleSelectAll,
  onBulkStock,
  onBulkPrice,
  disabled = false,
}: AdminStockBulkEditBarProps) {
  const selectionLabel =
    selectedCount === 0
      ? "Aucune sélection"
      : selectedCount === targets.length
        ? `Tout (${targets.length})`
        : `${selectedCount} / ${targets.length}`;

  return (
    <div
      className="dingry-admin-track-linear flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2"
      data-admin-no-reorder
    >
      {!editActive ? (
        <button
          type="button"
          onClick={onEnterEdit}
          aria-pressed={false}
          title="Tout modifier (stock et prix en lot)"
          disabled={disabled || targets.length === 0}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 transition hover:border-white/25 disabled:opacity-35"
        >
          <Pencil size={14} aria-hidden />
          <span className="sr-only">Tout modifier</span>
        </button>
      ) : null}

      {editActive ? (
        <>
          <label className="flex min-w-0 cursor-pointer items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/60">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              onChange={onToggleSelectAll}
              disabled={disabled || targets.length === 0}
              className="h-3.5 w-3.5 rounded border-white/20 bg-black/40 accent-[#FF3D00]"
            />
            <span className="tabular-nums">{selectionLabel}</span>
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" className={CHIP} disabled={disabled || selectedCount === 0} onClick={() => onBulkStock(-1)}>
              −1 stock
            </button>
            <button type="button" className={CHIP} disabled={disabled || selectedCount === 0} onClick={() => onBulkStock(1)}>
              +1 stock
            </button>
            <button type="button" className={CHIP} disabled={disabled || selectedCount === 0} onClick={() => onBulkPrice(-1)}>
              −1 €
            </button>
            <button type="button" className={CHIP} disabled={disabled || selectedCount === 0} onClick={() => onBulkPrice(1)}>
              +1 €
            </button>
          </div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-1.5">
            <button type="button" className={CHIP_MUTED} disabled={disabled} onClick={onCancelEdit}>
              Annuler
            </button>
            <button type="button" className={CHIP_CONFIRM} disabled={disabled} onClick={onConfirmEdit}>
              Valider
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}