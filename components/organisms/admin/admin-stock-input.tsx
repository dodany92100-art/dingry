"use client";

import { useEffect, useState } from "react";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/order-view";
import type { AdminProduct } from "@/lib/admin/types";

type AdminStockInputProps = {
  product: AdminProduct;
  disabled: boolean;
  onSetStock: (product: AdminProduct, nextStock: number) => void;
  className?: string;
};

export function AdminStockInput({ product, disabled, onSetStock, className }: AdminStockInputProps) {
  const [draft, setDraft] = useState(String(product.stock));

  useEffect(() => {
    setDraft(String(product.stock));
  }, [product.stock]);

  function commit() {
    const parsed = Number(draft);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 9999) {
      setDraft(String(product.stock));
      return;
    }
    onSetStock(product, parsed);
  }

  return (
    <input
      type="number"
      min={0}
      max={9999}
      step={1}
      inputMode="numeric"
      disabled={disabled}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => commit()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
      aria-label={`Stock ${product.name}`}
      className={`h-8 w-16 border border-white/15 bg-black px-1 text-center text-sm tabular-nums text-white outline-none focus:border-white/40 disabled:opacity-40 ${
        product.stock <= LOW_STOCK_THRESHOLD ? "text-[#7EB3FF]" : ""
      } ${className ?? ""}`}
    />
  );
}
