"use client";

import { Eye } from "lucide-react";
import { motion } from "motion/react";

type AdminStockPreviewToggleProps = {
  active: boolean;
  onChange: (active: boolean) => void;
};

const LAYOUT_ID = "dingry-admin-stock-preview-indicator";

export function AdminStockPreviewToggle({ active, onChange }: AdminStockPreviewToggleProps) {
  return (
    <div
      className="dingry-admin-glass inline-flex shrink-0 items-center gap-0.5 rounded-full p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/15"
      role="group"
      aria-label="Mode stock"
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!active}
        title="Mode édition CRM"
        className="relative z-0 rounded-full px-3 py-2 transition-colors duration-200 sm:px-3.5"
      >
        {!active ? (
          <motion.span
            layoutId={LAYOUT_ID}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-white to-violet-100/90 shadow-[0_4px_20px_rgba(167,139,250,0.3),0_0_0_1px_rgba(255,255,255,0.2)_inset]"
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
            aria-hidden
          />
        ) : null}
        <span
          className={`relative z-10 text-[10px] font-medium uppercase tracking-[0.14em] sm:tracking-[0.16em] ${
            !active ? "text-[#0a0f18]" : "text-white/50 hover:text-white/80"
          }`}
        >
          <span className="sm:hidden">CRM</span>
          <span className="hidden sm:inline">Édition</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={active}
        title="Aperçu temps réel boutique"
        className="relative z-0 flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors duration-200 sm:px-3.5"
      >
        {active ? (
          <motion.span
            layoutId={LAYOUT_ID}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff8a4d]/25 via-[#ff3d00]/20 to-violet-500/15 shadow-[0_4px_22px_rgba(255,61,0,0.28),0_0_0_1px_rgba(255,138,77,0.35)_inset]"
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
            aria-hidden
          />
        ) : null}
        <Eye
          size={15}
          strokeWidth={1.75}
          className={`relative z-10 shrink-0 ${active ? "text-[#ff8a4d]" : "text-white/45"}`}
          aria-hidden
        />
        <span
          className={`relative z-10 text-[10px] font-medium uppercase tracking-[0.12em] sm:tracking-[0.16em] ${
            active ? "text-[#ff8a4d]" : "text-white/50 hover:text-white/80"
          }`}
        >
          <span className="sm:hidden">Aperçu</span>
          <span className="hidden lg:inline">Aperçu temps réel</span>
          <span className="hidden sm:inline lg:hidden">Aperçu</span>
        </span>
      </button>
    </div>
  );
}
