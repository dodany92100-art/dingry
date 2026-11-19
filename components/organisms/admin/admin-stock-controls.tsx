"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AdminStockAutosaveHint } from "@/components/organisms/admin/admin-stock-autosave-hint";
import { AdminStockInput } from "@/components/organisms/admin/admin-stock-input";
import type { StockAutosavePhase } from "@/lib/admin/stock-autosave-types";
import type { AdminProduct } from "@/lib/admin/types";

type AdminStockControlsProps = {
  product: AdminProduct;
  busy: boolean;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  onEdit: (product: AdminProduct) => void;
  layout?: "card" | "row";
  autosavePhase?: StockAutosavePhase;
};

const BTN =
  "flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm text-white/80 shadow-none transition hover:border-[#FF3D00]/50 hover:bg-[#FF3D00]/15 hover:text-white disabled:opacity-30";
const BTN_COMPACT = `${BTN} h-7 w-7 text-xs`;
const BTN_ROW = `${BTN} h-8 w-8`;
const BTN_EDIT_ROW =
  "ml-1 h-8 shrink-0 rounded-full px-3 text-[10px] uppercase tracking-[0.12em] text-white/55 transition hover:bg-white/10 hover:text-white";
const BTN_EDIT_CARD =
  "ml-0.5 h-7 shrink-0 rounded-full px-2.5 text-[10px] uppercase tracking-[0.12em] text-white/55 transition hover:bg-white/10 hover:text-white md:h-8 md:px-3";

const TRIGGER_CLASS =
  "flex w-full min-w-0 items-center justify-end gap-1 py-0.5 text-right transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/40 rounded-md";

type StockControlPanelProps = {
  product: AdminProduct;
  disabled: boolean;
  panelId: string;
  open: boolean;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  onEdit: (product: AdminProduct) => void;
  layout: "card" | "row";
  autosavePhase?: StockAutosavePhase;
};

function StockControlPanel({
  product,
  disabled,
  panelId,
  open,
  onChangeStock,
  onSetStock,
  onEdit,
  layout,
  autosavePhase,
}: StockControlPanelProps) {
  const cardLayout = layout === "card";

  return (
    <div
      id={panelId}
      className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">
        {cardLayout ? (
          <div className="flex w-full min-w-0 flex-col gap-1 pt-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-0.5">
            <StockQtyControls
              product={product}
              disabled={disabled}
              onChangeStock={onChangeStock}
              onSetStock={onSetStock}
              compact
            />
            <button type="button" onClick={() => onEdit(product)} className={`${BTN_EDIT_CARD} w-full sm:ml-0.5 sm:w-auto`}>
              Modifier
            </button>
            <div className="w-full sm:w-auto sm:basis-full">
              <AdminStockAutosaveHint phase={autosavePhase} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-0.5 pt-1">
            <StockQtyControls
              product={product}
              disabled={disabled}
              onChangeStock={onChangeStock}
              onSetStock={onSetStock}
              compact={false}
            />
            <button type="button" onClick={() => onEdit(product)} className={BTN_EDIT_ROW}>
              Modifier
            </button>
            <AdminStockAutosaveHint phase={autosavePhase} />
          </div>
        )}
      </div>
    </div>
  );
}

function StockQtyControls({
  product,
  disabled,
  onChangeStock,
  onSetStock,
  compact,
}: {
  product: AdminProduct;
  disabled: boolean;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  compact: boolean;
}) {
  return (
    <div className={`flex min-w-0 items-center justify-center gap-0.5 ${compact ? "" : "gap-1.5 md:gap-2"}`}>
      <button
        type="button"
        disabled={disabled || product.stock === 0}
        onClick={() => onChangeStock(product, -1)}
        className={compact ? BTN_COMPACT : BTN_ROW}
        aria-label={`Retirer un ${product.name}`}
      >
        −
      </button>
      <AdminStockInput
        product={product}
        disabled={disabled}
        onSetStock={onSetStock}
        className={
          compact
            ? "h-7 w-12 min-w-0 max-w-[3.25rem] flex-1 rounded-full border-white/10 bg-white/[0.04] text-center text-xs tabular-nums sm:w-14 sm:max-w-none sm:flex-none"
            : "h-8 w-16 rounded-full border-white/10 bg-white/[0.04] text-center"
        }
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChangeStock(product, 1)}
        className={compact ? BTN_COMPACT : BTN_ROW}
        aria-label={`Ajouter un ${product.name}`}
      >
        +
      </button>
    </div>
  );
}

function AccordionTrigger({
  product,
  open,
  panelId,
  onToggle,
  className = "",
}: {
  product: AdminProduct;
  open: boolean;
  panelId: string;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`${TRIGGER_CLASS} ${className}`}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
      aria-label={`Stock ${product.stock} pièces — ouvrir les contrôles`}
    >
      <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        {product.stock}
      </span>
      <ChevronDown
        size={14}
        strokeWidth={2}
        className={`shrink-0 text-white/45 transition-transform duration-200 motion-reduce:transition-none ${
          open ? "rotate-180" : ""
        }`}
        aria-hidden
      />
    </button>
  );
}

export function AdminStockControls({
  product,
  busy,
  onChangeStock,
  onSetStock,
  onEdit,
  layout = "card",
  autosavePhase,
}: AdminStockControlsProps) {
  const disabled = busy;
  const [open, setOpen] = useState(false);
  const reactId = useId();
  const panelId = `dingry-stock-controls-${product.id}${reactId}`;

  const sharedPanel = (
    <StockControlPanel
      product={product}
      disabled={disabled}
      panelId={panelId}
      open={open}
      onChangeStock={onChangeStock}
      onSetStock={onSetStock}
      onEdit={onEdit}
      layout={layout}
      autosavePhase={autosavePhase}
    />
  );

  if (layout === "row") {
    return (
      <div className="flex shrink-0 flex-col items-stretch gap-0" data-admin-no-reorder>
        <AccordionTrigger
          product={product}
          open={open}
          panelId={panelId}
          onToggle={() => setOpen((v) => !v)}
          className="w-auto self-end"
        />
        {sharedPanel}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 border-t border-white/[0.06] pt-1.5" data-admin-no-reorder>
      <AccordionTrigger
        product={product}
        open={open}
        panelId={panelId}
        onToggle={() => setOpen((v) => !v)}
      />
      {sharedPanel}
    </div>
  );
}