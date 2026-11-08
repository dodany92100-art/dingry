"use client";

import type { StockAutosavePhase } from "@/lib/admin/stock-autosave-types";

export function AdminStockAutosaveHint({ phase }: { phase?: StockAutosavePhase }) {
  if (!phase) return null;
  return (
    <p
      className={`text-center text-[8px] uppercase tracking-[0.12em] sm:text-[9px] ${
        phase === "saved" ? "text-emerald-400/85" : "text-white/40"
      }`}
      aria-live="polite"
    >
      {phase === "saving" ? "Enregistrement…" : "Enregistré ✓"}
    </p>
  );
}
