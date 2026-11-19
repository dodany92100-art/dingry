"use client";

import { motion } from "motion/react";
import type { StockColorSortMode } from "@/lib/admin/stock-color-luminance";
import { cycleStockColorSortMode } from "@/lib/admin/stock-color-luminance";

type AdminStockColorSortToggleProps = {
  mode: StockColorSortMode;
  onChange: (mode: StockColorSortMode) => void;
  onValidate?: () => void;
  validateBusy?: boolean;
  validateDisabled?: boolean;
};

const MODE_META: Record<StockColorSortMode, { title: string; label: string }> = {
  default: {
    title: "Tri des couleurs du stock (luminosité · clic : clair → sombre)",
    label: "Tri couleurs",
  },
  light: {
    title: "Du plus clair au plus sombre — valide pour appliquer sur le site",
    label: "Clair vers sombre",
  },
  dark: {
    title: "Du plus sombre au plus clair — valide pour appliquer sur le site",
    label: "Sombre vers clair",
  },
};

const GRADIENT_LIGHT_TO_DARK =
  "linear-gradient(90deg, #fafaf6 0%, #c8f5dc 11%, #b8e4ff 22%, #fff3a8 34%, #e8c84a 44%, #52c47a 56%, #4a9cf0 68%, #1b4a3a 80%, #152a52 90%, #080808 100%)";

const GRADIENT_DARK_TO_LIGHT =
  "linear-gradient(90deg, #080808 0%, #152a52 10%, #1b4a3a 20%, #4a9cf0 32%, #52c47a 44%, #e8c84a 56%, #fff3a8 66%, #b8e4ff 78%, #c8f5dc 89%, #fafaf6 100%)";

function StockColorSortSwatches({ mode }: { mode: StockColorSortMode }) {
  const inactive = mode === "default";
  const background = mode === "dark" ? GRADIENT_DARK_TO_LIGHT : GRADIENT_LIGHT_TO_DARK;
  return (
    <span
      aria-hidden
      className={`relative z-10 block h-[11px] w-9 rounded-full md:h-3 md:w-[2.35rem] ${
        inactive ? "opacity-55 saturate-[0.85]" : "opacity-95 saturate-100"
      }`}
      style={{
        background,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
      }}
    />
  );
}

const SORT_LAYOUT_ID = "dingry-admin-stock-color-sort-indicator";

export function AdminStockColorSortToggle({
  mode,
  onChange,
  onValidate,
  validateBusy = false,
  validateDisabled = false,
}: AdminStockColorSortToggleProps) {
  const { title, label } = MODE_META[mode];
  const showValidate = mode !== "default" && onValidate;
  const active = mode !== "default";

  return (
    <div className="flex shrink-0 items-center gap-1 min-[450px]:gap-1.5">
      <button
        type="button"
        onClick={() => onChange(cycleStockColorSortMode(mode))}
        title={title}
        aria-pressed={active}
        aria-label={`Tri couleur · ${label}`}
        className="dingry-admin-track-linear relative inline-flex h-8 shrink-0 items-center justify-center rounded-full px-2 py-1 transition md:h-9"
      >
        {active ? (
          <motion.span
            layoutId={SORT_LAYOUT_ID}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white/18 via-white/10 to-violet-100/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
            aria-hidden
          />
        ) : null}
        <StockColorSortSwatches mode={mode} />
      </button>
      {showValidate ? (
        <button
          type="button"
          disabled={validateDisabled || validateBusy}
          onClick={onValidate}
          title="Enregistrer cet ordre sur la boutique"
          className="dingry-admin-track-linear inline-flex h-7 shrink-0 items-center rounded-full px-2 text-[7px] font-medium uppercase tracking-[0.08em] text-emerald-300/90 transition hover:text-emerald-200 disabled:opacity-45 md:h-7 md:px-2"
        >
          {validateBusy ? "…" : "Valider"}
        </button>
      ) : null}
    </div>
  );
}