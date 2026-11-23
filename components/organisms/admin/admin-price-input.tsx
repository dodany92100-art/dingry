"use client";

import { useEffect, useState } from "react";
import type { AdminProduct } from "@/lib/admin/types";

type AdminPriceInputProps = {
  product: AdminProduct;
  disabled: boolean;
  onSetPrice: (product: AdminProduct, nextPrice: number) => void;
  className?: string;
};

export function AdminPriceInput({ product, disabled, onSetPrice, className }: AdminPriceInputProps) {
  const [draft, setDraft] = useState(formatDraft(product.price));

  useEffect(() => {
    setDraft(formatDraft(product.price));
  }, [product.price]);

  function commit() {
    const parsed = parsePriceDraft(draft);
    if (parsed === null) {
      setDraft(formatDraft(product.price));
      return;
    }
    if (parsed === product.price) return;
    onSetPrice(product, parsed);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => commit()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
          (event.target as HTMLInputElement).blur();
        }
      }}
      aria-label={`Prix ${product.name}`}
      className={`h-7 w-11 min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-0.5 text-center text-[11px] tabular-nums text-white outline-none focus:border-[#FF3D00]/45 disabled:opacity-40 sm:w-12 md:h-8 md:text-xs ${className ?? ""}`}
    />
  );
}

function formatDraft(price: number): string {
  const rounded = Math.round(price * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, "");
}

function parsePriceDraft(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 10_000) return null;
  return Math.round(parsed * 100) / 100;
}

const BTN_COMPACT =
  "flex h-7 w-7 shrink-0 touch-manipulation items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs text-white/80 transition hover:border-[#FF3D00]/50 hover:bg-[#FF3D00]/15 hover:text-white disabled:opacity-30";

type AdminStockPriceControlsProps = {
  product: AdminProduct;
  disabled: boolean;
  onChangePrice: (product: AdminProduct, delta: number) => void;
  onSetPrice: (product: AdminProduct, nextPrice: number) => void;
};

/** ± et saisie TTC sur la carte (mode lot CRM). */
export function AdminStockPriceControls({
  product,
  disabled,
  onChangePrice,
  onSetPrice,
}: AdminStockPriceControlsProps) {
  return (
    <div
      className="flex w-full min-w-0 touch-manipulation items-center justify-start gap-1"
      data-admin-no-reorder
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled || product.price <= 1}
        onClick={() => onChangePrice(product, -1)}
        className={BTN_COMPACT}
        aria-label={`Baisser le prix de ${product.name}`}
      >
        −
      </button>
      <AdminPriceInput product={product} disabled={disabled} onSetPrice={onSetPrice} />
      <span className="shrink-0 text-[10px] text-white/45" aria-hidden>
        €
      </span>
      <button
        type="button"
        disabled={disabled || product.price >= 10_000}
        onClick={() => onChangePrice(product, 1)}
        className={BTN_COMPACT}
        aria-label={`Augmenter le prix de ${product.name}`}
      >
        +
      </button>
    </div>
  );
}