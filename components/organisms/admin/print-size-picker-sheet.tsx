"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { printProductLabels } from "@/lib/admin/print-product-labels";
import { MODAL_OVERLAY_TRANSITION, MODAL_PANEL_SPRING } from "@/components/organisms/shop/motion";

export type PrintSizePickerProduct = {
  name: string;
  variant: string;
  sku: string;
  /** Toutes les tailles actives sur la fiche (pas une seule par défaut). */
  sizes: readonly string[];
  /** Stock pool global CRM (partagé entre tailles). */
  stockPool: number;
};

type PrintSizePickerSheetProps = {
  open: boolean;
  product: PrintSizePickerProduct | null;
  onClose: () => void;
};

function sortSizes(sizes: readonly string[]): string[] {
  return [...sizes].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isInteger(na) && Number.isInteger(nb)) return na - nb;
    return a.localeCompare(b, "fr");
  });
}

/** Choix des tailles à imprimer (étiquettes stock). */
export function PrintSizePickerSheet({ open, product, onClose }: PrintSizePickerSheetProps) {
  const sizes = useMemo(() => (product ? sortSizes(product.sizes) : []), [product]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || sizes.length === 0) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(sizes));
  }, [open, sizes]);

  if (!product) return null;

  const allSelected = sizes.length > 0 && sizes.every((size) => selected.has(size));

  function toggle(size: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(size)) next.delete(size);
      else next.add(size);
      return next;
    });
  }

  function selectAll() {
    setSelected(allSelected ? new Set() : new Set(sizes));
  }

  function handlePrint() {
    if (!product) return;
    const picked = sizes.filter((size) => selected.has(size));
    if (picked.length === 0) return;
    const title = `${product.name}${product.variant ? ` — ${product.variant}` : ""}`.trim();
    printProductLabels({
      title,
      sku: product.sku.trim() || "—",
      lines: picked.map((size) => ({ size, stock: Math.max(0, product.stockPool) })),
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_OVERLAY_TRANSITION}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="print-size-picker-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={MODAL_PANEL_SPRING}
            className="relative z-10 flex max-h-[85dvh] w-full max-w-md flex-col border border-zinc-800 bg-zinc-900 shadow-2xl sm:rounded-sm"
          >
            <div className="border-b border-zinc-800 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Impression stock</p>
              <h2 id="print-size-picker-title" className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-white">
                {product.name}
              </h2>
              {product.variant ? (
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400">{product.variant}</p>
              ) : null}
              <p className="mt-2 text-[9px] leading-relaxed tracking-[0.06em] text-zinc-500">
                Stock affiché = pool global CRM (partagé entre toutes les tailles cochées sur la fiche).
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {sizes.length === 0 ? (
                <p className="text-sm text-zinc-400">Aucune taille active sur cette fiche.</p>
              ) : (
                <ul className="space-y-2">
                  {sizes.map((size) => {
                    const active = selected.has(size);
                    return (
                      <li key={size}>
                        <button
                          type="button"
                          onClick={() => toggle(size)}
                          aria-pressed={active}
                          className={`flex w-full items-center justify-between border px-3 py-2.5 text-left transition ${
                            active
                              ? "border-white/30 bg-white/10 text-white"
                              : "border-zinc-700 bg-zinc-950 text-zinc-400"
                          }`}
                        >
                          <span className="text-xs font-medium tracking-[0.2em]">{size}</span>
                          <span className="text-[10px] tabular-nums tracking-wider text-zinc-300">
                            Stock · {Math.max(0, product.stockPool)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-zinc-800 px-5 py-4 sm:flex-row">
              <button
                type="button"
                disabled={sizes.length === 0}
                onClick={selectAll}
                className="h-10 flex-1 border border-zinc-600 text-[10px] uppercase tracking-[0.18em] text-zinc-300 hover:border-zinc-400 disabled:opacity-40"
              >
                {allSelected ? "Tout désélectionner" : "Toutes les déclinaisons"}
              </button>
              <button
                type="button"
                disabled={selected.size === 0}
                onClick={handlePrint}
                className="h-10 flex-1 border border-white bg-white text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-900 disabled:opacity-40"
              >
                Imprimer
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
