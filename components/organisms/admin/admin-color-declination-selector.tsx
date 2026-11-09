"use client";

import {
  buildColorDeclinationBackendFields,
  DINGRY_COLOR_PRESETS,
  adminSwatchStyle,
  frenchLabelForColorPreset,
  normalizeCanonicalColorPreset,
  techCodeForColorPreset,
} from "@/lib/admin/dingry-color-palette";
import type { CSSProperties } from "react";

type AdminColorDeclinationSelectorProps = {
  selected: readonly string[];
  onToggle: (presetKey: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  productId?: string;
  productName?: string;
  parentSku?: string;
};

function canonicalSelectionKey(raw: string): string {
  return normalizeCanonicalColorPreset(raw) ?? raw.trim().toUpperCase();
}

export function AdminColorDeclinationSelector({
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
  productId = "",
  productName = "",
  parentSku = "",
}: AdminColorDeclinationSelectorProps) {
  const selectedKeys = new Set(selected.map(canonicalSelectionKey).filter(Boolean));
  const showBackend = productId.trim().length > 0 && parentSku.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
          Couleurs · boutique
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={onSelectAll} className={TOOLBAR_BTN}>
            Toutes
          </button>
          <button type="button" onClick={onClearAll} className={TOOLBAR_BTN}>
            Effacer
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8"
        role="group"
        aria-label="Sélecteur couleurs DINGRY"
      >
        {DINGRY_COLOR_PRESETS.map((row) => {
          const active = selectedKeys.has(row.presetKey);
          const swatchStyle = adminSwatchStyle(row.presetKey) as CSSProperties;
          return (
            <button
              key={row.presetKey}
              type="button"
              title={`${row.labelFr} · ${row.techCode}`}
              aria-label={`${row.labelFr}, code ${row.techCode}`}
              aria-pressed={active}
              onClick={() => onToggle(row.presetKey)}
              className={`group flex min-w-0 items-center gap-1.5 rounded-md border px-1.5 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/40 ${
                active
                  ? "border-white/40 bg-white/[0.08] ring-1 ring-white/15"
                  : "border-white/10 bg-[#0e1628]/50 hover:border-white/25 hover:bg-white/[0.04]"
              }`}
            >
              <span
                className={`h-5 w-5 shrink-0 rounded-full border ${
                  active ? "border-white/90" : "border-white/20"
                }`}
                style={swatchStyle}
                aria-hidden
              />
              <span className="min-w-0 flex-1 text-left leading-tight">
                <span
                  className={`block truncate text-[11px] font-medium ${
                    active ? "text-white" : "text-white/80 group-hover:text-white"
                  }`}
                >
                  {row.labelFr}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[8px] uppercase tracking-wide text-white/38">
                  {row.techCode}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 ? (
        <footer className="rounded-lg border border-white/10 bg-[#0a1020]/60 px-2 py-1.5">
          <ul className="flex flex-wrap gap-1">
            {selected.map((c) => (
              <li
                key={`chip-${c}`}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/12 bg-[#0e1628]/90 py-px pl-1 pr-1.5 text-[11px] text-white/90"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/25"
                  style={adminSwatchStyle(c) as CSSProperties}
                  aria-hidden
                />
                <span className="truncate font-medium">{frenchLabelForColorPreset(c)}</span>
                <span className="shrink-0 rounded bg-white/[0.06] px-1 py-px font-mono text-[8px] uppercase text-white/45">
                  {techCodeForColorPreset(c)}
                </span>
              </li>
            ))}
          </ul>

          {showBackend ? (
            <details className="mt-1.5 border-t border-white/8 pt-1.5">
              <summary className="cursor-pointer text-[10px] text-white/40 hover:text-white/55">
                Variantes techniques (SKU / R2)
              </summary>
              <ul className="mt-1 space-y-1">
                {selected.map((color) => {
                  const meta = buildColorDeclinationBackendFields({
                    productId: productId.trim(),
                    productName: productName.trim() || "Produit",
                    parentSku: parentSku.trim(),
                    colorLabel: color,
                  });
                  return (
                    <li
                      key={`meta-${color}`}
                      className="rounded border border-white/6 bg-black/20 px-2 py-1 font-mono text-[9px] leading-snug text-white/50"
                    >
                      <span className="font-sans text-[10px] text-white/65">
                        {frenchLabelForColorPreset(color)}
                      </span>
                      {" · "}
                      {meta.variantSku}
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}
        </footer>
      ) : (
        <p className="text-[12px] text-white/45">Clique une pastille · première couleur = variante par défaut.</p>
      )}
    </div>
  );
}

const TOOLBAR_BTN =
  "rounded-full border border-white/12 bg-[#0e1628] px-2.5 py-1 text-[11px] font-medium text-white/60 transition hover:border-white/22 hover:text-white";
