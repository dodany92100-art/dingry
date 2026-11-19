"use client";

import { Eye, PencilLine } from "lucide-react";
import { motion } from "motion/react";

type AdminStockPreviewToggleProps = {
  active: boolean;
  onChange: (active: boolean) => void;
  /** Barre secondaire (sous les onglets) : pilule plus petite. */
  compact?: boolean;
};

const LAYOUT_ID = "dingry-admin-stock-preview-indicator";

export function AdminStockPreviewToggle({
  active,
  onChange,
  compact = false,
}: AdminStockPreviewToggleProps) {
  const shell = compact ? "p-0.5" : "p-1";
  const hit = compact ? "px-2 py-1" : "px-3 py-2 sm:px-3.5";
  const label = compact
    ? "text-[9px] tracking-[0.1em]"
    : "text-[10px] tracking-[0.14em] sm:tracking-[0.16em]";

  return (
    <div
      className={`dingry-admin-track-linear inline-flex max-w-full shrink-0 items-center gap-0.5 rounded-full ${shell}`}
      role="group"
      aria-label="Mode stock"
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!active}
        title="Mode édition CRM"
        className={`relative z-0 rounded-full transition-colors duration-200 ${hit}`}
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
          className={`relative z-10 flex items-center gap-0.5 font-medium uppercase ${label} ${
            !active ? "text-[#0a0f18]" : "text-white/50 hover:text-white/80"
          }`}
        >
          <PencilLine
            size={compact ? 12 : 14}
            strokeWidth={1.75}
            className={`shrink-0 ${!active ? "text-[#0a0f18]" : "text-white/45"}`}
            aria-hidden
          />
          CRM
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={active}
        title="Aperçu catalogue boutique (intégré)"
        className={`relative z-0 flex items-center gap-1 rounded-full transition-colors duration-200 ${hit}`}
      >
        {active ? (
          <motion.span
            layoutId={LAYOUT_ID}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff8a4d]/25 via-[#ff3d00]/20 to-violet-500/15 shadow-[0_4px_22px_rgba(255,61,0,0.28),0_0_0_1px_rgba(255,138,77,0.35)_inset]"
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
            aria-hidden
          />
        ) : null}
        <span
          className={`relative z-10 flex items-center gap-0.5 font-medium uppercase ${label} ${
            active ? "text-[#ff8a4d]" : "text-white/50 hover:text-white/80"
          }`}
        >
          SITE
          <Eye
            size={compact ? 12 : 14}
            strokeWidth={1.75}
            className={`shrink-0 ${active ? "text-[#ff8a4d]" : "text-white/45"}`}
            aria-hidden
          />
        </span>
      </button>
    </div>
  );
}