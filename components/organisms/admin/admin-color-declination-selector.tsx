"use client";

import {
  adminColorTileChromeStyle,
  buildColorDeclinationBackendFields,
  buildCustomColorDeclination,
  canonicalColorDeclinationValue,
  colorDeclinationsCanonicallyEqual,
  DINGRY_COLOR_PRESETS,
  frenchLabelForColorPreset,
  normalizeCanonicalColorPreset,
  techCodeForColorPreset,
} from "@/lib/admin/dingry-color-palette";
import { DingryPaintSwatch } from "@/components/atoms/dingry-paint-swatch";
import { Check, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";

type AdminColorDeclinationSelectorProps = {
  selected: readonly string[];
  activeVariant: string;
  onToggle: (presetKey: string) => void;
  onActivateColor: (color: string) => void;
  onAddCustomColor: (name: string, hex: string) => void;
  onRemoveColor: (color: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  productId?: string;
  productName?: string;
  parentSku?: string;
};

function canonicalSelectionKey(raw: string): string {
  return canonicalColorDeclinationValue(raw).toUpperCase();
}

function isCustomColorDeclination(raw: string): boolean {
  return normalizeCanonicalColorPreset(raw) === undefined;
}

const FIELD_INPUT =
  "w-full min-w-0 rounded-lg border border-white/10 bg-[#141414] px-2.5 py-1.5 text-[13px] text-white placeholder:text-white/35 outline-none transition focus:border-white/20";

const TOOLBAR_BTN =
  "rounded-full border border-white/10 bg-[#161616] px-2.5 py-1 text-[11px] font-medium text-white/60 transition hover:border-white/16 hover:text-white";

const CHROMATIC_WHEEL_RING =
  "conic-gradient(#ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ec4899, #ef4444)";

/** Au-delà, puces aperçues + menu déroulant pour le reste. */
const SELECTED_CHIPS_INLINE_MAX = 4;

export function AdminColorDeclinationSelector({
  selected,
  activeVariant,
  onToggle,
  onActivateColor,
  onAddCustomColor,
  onRemoveColor,
  onSelectAll,
  onClearAll,
  productId = "",
  productName = "",
  parentSku = "",
}: AdminColorDeclinationSelectorProps) {
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#EA580C");
  const [customError, setCustomError] = useState("");
  const [customCreatorOpen, setCustomCreatorOpen] = useState(false);
  const chromaticInputRef = useRef<HTMLInputElement>(null);
  const selectedKeys = new Set(selected.map(canonicalSelectionKey).filter(Boolean));
  const customDeclinations = selected
    .filter(isCustomColorDeclination)
    .sort((a, b) =>
      frenchLabelForColorPreset(a).localeCompare(frenchLabelForColorPreset(b), "fr", {
        sensitivity: "base",
      }),
    );
  const showBackend = productId.trim().length > 0 && parentSku.trim().length > 0;

  function requestRemoveColor(color: string) {
    const label = frenchLabelForColorPreset(color);
    const ok = window.confirm(`Retirer la couleur « ${label} » des déclinaisons de ce produit ?`);
    if (!ok) return;
    onRemoveColor(color);
  }

  function isDefaultVariant(color: string): boolean {
    if (!activeVariant.trim()) {
      return selected.length > 0 && colorDeclinationsCanonicallyEqual(color, selected[0] ?? "");
    }
    return colorDeclinationsCanonicallyEqual(color, activeVariant);
  }

  const defaultLabel =
    activeVariant.trim().length > 0
      ? frenchLabelForColorPreset(activeVariant)
      : selected.length > 0
        ? frenchLabelForColorPreset(selected[0]!)
        : "—";

  const selectedCollapse = selected.length > SELECTED_CHIPS_INLINE_MAX;
  const selectedInline = selectedCollapse
    ? selected.slice(0, SELECTED_CHIPS_INLINE_MAX)
    : selected;
  const selectedOverflow = selectedCollapse ? selected.slice(SELECTED_CHIPS_INLINE_MAX) : [];

  function renderSelectedChip(color: string) {
    const label = frenchLabelForColorPreset(color);
    const isDefault = isDefaultVariant(color);
    const custom = isCustomColorDeclination(color);
    return (
      <li key={`sel-${canonicalSelectionKey(color)}`} role="listitem">
        <span
          className={`inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pl-1 text-[11px] ${
            isDefault
              ? "border-white bg-white pr-1 text-black"
              : "border-white/12 bg-[#161616] pr-1 text-white/85"
          }`}
        >
          <button
            type="button"
            title={isDefault ? "Variante par défaut" : "Définir comme défaut boutique"}
            onClick={() => onActivateColor(color)}
            className={`inline-flex min-w-0 items-center gap-1 rounded-full py-px pl-0.5 pr-1 ${
              isDefault ? "text-black" : "hover:text-white"
            }`}
          >
            <DingryPaintSwatch colorKey={color} size="xs" variant="chip" />
            <span className="max-w-[9rem] truncate font-medium">{label}</span>
            {isDefault ? (
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide opacity-70">
                défaut
              </span>
            ) : null}
          </button>
          {custom ? (
            <button
              type="button"
              aria-label={`Supprimer ${label}`}
              title="Supprimer (avec confirmation)"
              onClick={() => requestRemoveColor(color)}
              className={`rounded-full px-1 text-[13px] leading-none ${
                isDefault ? "text-black/45 hover:text-black" : "text-white/40 hover:text-red-200"
              }`}
            >
              ×
            </button>
          ) : null}
        </span>
      </li>
    );
  }

  function openChromaticWheel() {
    chromaticInputRef.current?.click();
  }

  function submitCustomColor() {
    const built = buildCustomColorDeclination(customName, customHex);
    if (!built) {
      setCustomError("Indique un nom et choisis une teinte sur la roue.");
      return;
    }
    setCustomError("");
    onAddCustomColor(customName.trim(), customHex);
    setCustomName("");
  }

  return (
    <div className="space-y-2 sm:space-y-2.5">
      <section
        aria-label="Créer une couleur personnalisée"
        className="rounded-xl border border-white/10 bg-[#141414] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      >
        <button
          type="button"
          className="group flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition hover:bg-white/[0.03] sm:px-3"
          aria-expanded={customCreatorOpen}
          aria-label={customCreatorOpen ? "Replier couleur personnalisée" : "Déplier couleur personnalisée"}
          onClick={() => setCustomCreatorOpen((open) => !open)}
        >
          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/65 group-hover:text-white/90 sm:text-[13px]">
            Couleur personnalisée
          </span>
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/14 bg-[#1a1a1a] text-white/70 transition group-hover:border-white/22 group-hover:text-white"
            aria-hidden
          >
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`transition-transform duration-200 ${customCreatorOpen ? "" : "-rotate-90"}`}
            />
          </span>
        </button>
        {customCreatorOpen ? (
          <div className="border-t border-white/10 px-2.5 pb-2.5 pt-2 sm:px-3">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Nom affiché boutique</span>
                <input
                  type="text"
                  value={customName}
                  onChange={(event) => {
                    setCustomName(event.target.value);
                    if (customError) setCustomError("");
                  }}
                  placeholder="Nom boutique…"
                  className={`${FIELD_INPUT} h-9`}
                  maxLength={48}
                />
              </label>
              <input
                ref={chromaticInputRef}
                type="color"
                value={customHex}
                onChange={(event) => setCustomHex(event.target.value.toUpperCase())}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
              />
              <button
                type="button"
                onClick={openChromaticWheel}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-[#161616] px-2 transition hover:border-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/30"
                aria-label={`Teinte ${customHex}, ouvrir la roue chromatique`}
                title="Roue chromatique"
              >
                <span
                  className="h-6 w-6 shrink-0 rounded-full border border-white/20 p-px"
                  style={{ background: CHROMATIC_WHEEL_RING }}
                  aria-hidden
                >
                  <span
                    className="block h-full w-full rounded-full border border-white/20"
                    style={{ backgroundColor: customHex }}
                  />
                </span>
                <span className="font-mono text-[10px] tabular-nums text-white/55">{customHex}</span>
              </button>
              <button
                type="button"
                onClick={submitCustomColor}
                className="h-9 shrink-0 rounded-lg border border-white/20 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-black transition hover:bg-white/90"
              >
                Ajouter
              </button>
            </div>
            {customError ? (
              <p className="mt-1.5 text-[10px] text-amber-300/90" role="alert">
                {customError}
              </p>
            ) : (
              <p className="mt-1.5 truncate text-[10px] text-white/38">
                Enregistré comme <span className="font-mono text-white/48">Nom · #HEX</span>
              </p>
            )}
          </div>
        ) : null}
      </section>

      {selected.length > 0 ? (
        <section
          aria-label="Couleurs sélectionnées pour la boutique"
          className="rounded-xl border border-white/10 bg-[#121212] px-2.5 py-2"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
              Sélectionnées · {selected.length}
            </p>
            <p className="text-[11px] text-white/45">
              Défaut boutique :{" "}
              <span className="font-semibold text-white">{defaultLabel}</span>
            </p>
          </div>
          <ul className="mt-2 flex flex-wrap gap-1" role="list">
            {selectedInline.map((color) => renderSelectedChip(color))}
          </ul>
          {selectedCollapse ? (
            <details className="group mt-1.5 rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-2 py-1.5">
              <summary className="cursor-pointer list-none text-[10px] font-medium text-white/50 transition marker:content-none hover:text-white/75 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-1.5">
                  <ChevronDown
                    size={12}
                    className="shrink-0 transition group-open:rotate-180"
                    aria-hidden
                  />
                  + {selectedOverflow.length} couleur{selectedOverflow.length > 1 ? "s" : ""} ·
                  déplier
                </span>
              </summary>
              <ul
                className="mt-2 flex max-h-36 flex-wrap gap-1 overflow-y-auto overscroll-contain pr-0.5"
                role="list"
              >
                {selectedOverflow.map((color) => renderSelectedChip(color))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      <div className="min-w-0 space-y-1">
        <div
          className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-[repeat(auto-fill,minmax(5.85rem,1fr))]"
          role="group"
          aria-label="Sélecteur couleurs DINGRY"
        >
        {DINGRY_COLOR_PRESETS.map((row) => {
          const active = selectedKeys.has(row.presetKey);
          const isDefault = active && isDefaultVariant(row.presetKey);
          const tilePhase = isDefault ? "default" : active ? "selected" : "idle";
          return (
            <button
              key={row.presetKey}
              type="button"
              title={`${row.labelFr} · ${row.techCode}${isDefault ? " · défaut boutique" : ""}`}
              aria-label={`${row.labelFr}, code ${row.techCode}`}
              aria-pressed={active}
              onClick={() => onToggle(row.presetKey)}
              style={adminColorTileChromeStyle(row.presetKey, tilePhase)}
              className="group relative flex min-w-0 items-center gap-1.5 rounded-lg border-0 px-1.5 py-1 transition duration-200 hover:brightness-[1.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/40"
            >
              {active ? (
                <span
                  className="pointer-events-none absolute right-0 top-0 flex h-3.5 w-3.5 -translate-y-1/3 translate-x-1/3 items-center justify-center rounded-full border border-black/25 bg-white text-[#0a0f18] shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
                  aria-hidden
                >
                  <Check size={9} strokeWidth={3} />
                </span>
              ) : null}
              <DingryPaintSwatch colorKey={row.presetKey} size="md" active={active} variant="tile" />
              <span className="min-w-0 flex-1 text-left leading-tight">
                <span
                  className={`block truncate text-[11px] font-medium drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)] ${
                    active ? "text-white" : "text-white/82 group-hover:text-white"
                  }`}
                >
                  {row.labelFr}
                </span>
                <span
                  className={`mt-0.5 block truncate font-mono text-[8px] uppercase tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)] ${
                    active ? "text-white/62" : "text-white/45"
                  }`}
                >
                  {row.techCode}
                </span>
              </span>
            </button>
          );
        })}
        {customDeclinations.map((color) => {
          const label = frenchLabelForColorPreset(color);
          const code = techCodeForColorPreset(color);
          const isDefault = isDefaultVariant(color);
          return (
            <div
              key={`custom-decl-${canonicalSelectionKey(color)}`}
              style={adminColorTileChromeStyle(color, isDefault ? "default" : "selected")}
              className="flex min-w-0 items-stretch gap-0.5 overflow-hidden rounded-lg border-0"
            >
              <button
                type="button"
                title={`${label} · ${code} · perso${isDefault ? " · défaut boutique" : ""}`}
                aria-label={`${label}, couleur personnalisée, code ${code}`}
                aria-pressed
                onClick={() => onActivateColor(color)}
                className="group relative flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1 text-left transition hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/40"
              >
                <span
                  className="pointer-events-none absolute left-1 top-0 flex h-3.5 w-3.5 -translate-y-1/3 items-center justify-center rounded-full border border-black/25 bg-white text-[#0a0f18] shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
                  aria-hidden
                >
                  <Check size={9} strokeWidth={3} />
                </span>
                <DingryPaintSwatch colorKey={color} size="md" active variant="tile" />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[11px] font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
                    {label}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[8px] uppercase tracking-wide text-white/55 drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]">
                    {code}
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label={`Supprimer ${label}`}
                title="Supprimer cette couleur"
                onClick={() => requestRemoveColor(color)}
                className="shrink-0 bg-black/20 px-1.5 text-[14px] leading-none text-white/45 transition hover:bg-red-500/20 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/35"
              >
                ×
              </button>
            </div>
          );
        })}
        </div>

        <div
          className="flex max-w-full flex-wrap items-center gap-1.5"
          role="toolbar"
          aria-label="Sélection rapide des couleurs catalogue"
        >
          <button type="button" onClick={onSelectAll} className={TOOLBAR_BTN}>
            Toutes
          </button>
          <button type="button" onClick={onClearAll} className={TOOLBAR_BTN}>
            Effacer
          </button>
        </div>
      </div>

      {selected.length > 0 && showBackend ? (
        <footer className="rounded-lg border border-white/10 bg-[#121212] px-2 py-1.5">
          <details className="border-white/8">
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
        </footer>
      ) : null}

      {selected.length === 0 ? (
        <p className="text-[12px] text-white/45">
          Pastilles CRM ou couleur nommée ci-dessus · première entrée = variante par défaut.
        </p>
      ) : null}
    </div>
  );
}