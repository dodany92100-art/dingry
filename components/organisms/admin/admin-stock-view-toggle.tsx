"use client";

import { LayoutGrid, List } from "lucide-react";
import { motion } from "motion/react";

export type AdminStockViewMode = "grid" | "list";

type AdminStockViewToggleProps = {
  mode: AdminStockViewMode;
  onChange: (mode: AdminStockViewMode) => void;
};

const LAYOUT_ID = "dingry-admin-stock-view-indicator";

export function AdminStockViewToggle({ mode, onChange }: AdminStockViewToggleProps) {
  return (
    <div
      className="dingry-admin-glass inline-flex shrink-0 items-center gap-0.5 rounded-full p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/15"
      role="group"
      aria-label="Mode d’affichage stock"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={mode === "grid"}
        title="Grille visuelle"
        className="relative z-0 flex h-9 w-10 items-center justify-center rounded-full transition-colors duration-200 sm:w-11"
      >
        {mode === "grid" ? (
          <motion.span
            layoutId={LAYOUT_ID}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-white to-violet-100/90 shadow-[0_4px_20px_rgba(167,139,250,0.3),0_0_0_1px_rgba(255,255,255,0.2)_inset]"
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
            aria-hidden
          />
        ) : null}
        <LayoutGrid
          size={16}
          strokeWidth={1.75}
          className={`relative z-10 ${mode === "grid" ? "text-[#0a0f18]" : "text-white/45"}`}
          aria-hidden
        />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={mode === "list"}
        title="Tableau compact"
        className="relative z-0 flex h-9 w-10 items-center justify-center rounded-full transition-colors duration-200 sm:w-11"
      >
        {mode === "list" ? (
          <motion.span
            layoutId={LAYOUT_ID}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-white to-violet-100/90 shadow-[0_4px_20px_rgba(167,139,250,0.3),0_0_0_1px_rgba(255,255,255,0.2)_inset]"
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
            aria-hidden
          />
        ) : null}
        <List
          size={16}
          strokeWidth={1.75}
          className={`relative z-10 ${mode === "list" ? "text-[#0a0f18]" : "text-white/45"}`}
          aria-hidden
        />
      </button>
    </div>
  );
}
