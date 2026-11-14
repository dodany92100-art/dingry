"use client";

import {
  buildColorDeclinationBackendFields,
  buildCustomColorDeclination,
  canonicalColorDeclinationValue,
  colorDeclinationsCanonicallyEqual,
  DINGRY_COLOR_PRESETS,
  adminSwatchStyle,
  frenchLabelForColorPreset,
  normalizeCanonicalColorPreset,
  techCodeForColorPreset,
} from "@/lib/admin/dingry-color-palette";
import { useRef, useState, type CSSProperties } from "react";

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
  "w-full min-w-0 rounded-lg border border-white/12 bg-[#0a1020] px-2.5 py-2 text-[13px] text-white placeholder:text-white/35 outline-none transition focus:border-white/30";

const TOOLBAR_BTN =
  "rounded-full border border-white/12 bg-[#0e1628] px-2.5 py-1 text-[11px] font-medium text-white/60 transition hover:border-white/22 hover:text-white";

const CHROMATIC_WHEEL_RING =
  "conic-gradient(#ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ec4899, #ef4444)";

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
  const [customCreatorOpen, setCustomCreatorOpen] = useState(true);
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
    <div className="space-y-3">
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

      <section
        aria-label="Créer une couleur personnalisée"
        className="rounded-xl border border-white/18 bg-[#0e1628]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left sm:px-3.5"
          aria-expanded={customCreatorOpen}
          onClick={() => setCustomCreatorOpen((open) => !open)}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
            Nouvelle couleur (roue chromatique)
          </span>
          <span className="shrink-0 text-[13px] leading-none text-white/45" aria-hidden>
            {customCreatorOpen ? "▾" : "▸"}
          </span>
        </button>
        {customCreatorOpen ? (
          <div className="border-t border-white/10 px-3 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="min-w-0 flex-1 sm:min-w-[10rem]">
            <span className="mb-1 block text-[11px] text-white/45">Nom affiché boutique</span>
            <input
              type="text"
              value={customName}
              onChange={(event) => {
                setCustomName(event.target.value);
                if (customError) setCustomError("");
              }}
              placeholder="Ex. Corail sunset"
              className={FIELD_INPUT}
              maxLength={48}
            />
          </label>
          <div className="shrink-0">
            <span className="mb-1 block text-[11px] text-white/45">Teinte · roue</span>
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
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/12 bg-[#0a1020] px-3 py-2 transition hover:border-white/28 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35"
              aria-label={`Roue chromatique, teinte actuelle ${customHex}`}
              title="Ouvrir la roue chromatique"
            >
              <span
                className="relative h-[4.25rem] w-[4.25rem] rounded-full p-[5px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition group-hover:scale-[1.03]"
                style={{ background: CHROMATIC_WHEEL_RING }}
              >
                <span
                  className="block h-full w-full rounded-full border border-white/25 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)]"
                  style={{ backgroundColor: customHex }}
                  aria-hidden
                />
              </span>
              <span className="font-mono text-[10px] tabular-nums text-white/50 group-hover:text-white/65">
                {customHex}
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={submitCustomColor}
            className="shrink-0 rounded-lg border border-white/25 bg-white px-3 py-2 text-[12px] font-semibold text-black transition hover:bg-white/90 sm:self-end"
          >
            Ajouter la couleur
          </button>
        </div>
        {customError ? (
          <p className="mt-2 text-[11px] text-amber-300/90" role="alert">
            {customError}
          </p>
        ) : (
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            Nom + teinte → déclinaison enregistrée comme{" "}
            <span className="font-mono text-white/50">Nom · #HEX</span>
          </p>
        )}
          </div>
        ) : null}
      </section>

      {selected.length > 0 ? (
        <section
          aria-label="Couleurs sélectionnées pour la boutique"
          className="rounded-xl border border-white/14 bg-[#0a1020]/80 px-2.5 py-2"
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
            {selected.map((color) => {
              const label = frenchLabelForColorPreset(color);
              const isDefault = isDefaultVariant(color);
              const custom = isCustomColorDeclination(color);
              return (
                <li key={`sel-${canonicalSelectionKey(color)}`} role="listitem">
                  <span
                    className={`inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pl-1 text-[11px] ${
                      isDefault
                        ? "border-white bg-white pr-1 text-black"
                        : "border-white/15 bg-[#0e1628] pr-1 text-white/85"
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
                      <span
                        className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                        style={adminSwatchStyle(color) as CSSProperties}
                        aria-hidden
                      />
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
                          isDefault
                            ? "text-black/45 hover:text-black"
                            : "text-white/40 hover:text-red-200"
                        }`}
                      >
                        ×
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 text-[10px] leading-relaxed text-white/38">
            Clic sur une puce = variante par défaut · pastilles CRM = activer/désactiver · perso = × pour
            supprimer
          </p>
        </section>
      ) : null}

      <div
        className="grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8"
        role="group"
        aria-label="Sélecteur couleurs DINGRY"
      >
        {DINGRY_COLOR_PRESETS.map((row) => {
          const active = selectedKeys.has(row.presetKey);
          const isDefault = active && isDefaultVariant(row.presetKey);
          const swatchStyle = adminSwatchStyle(row.presetKey) as CSSProperties;
          return (
            <button
              key={row.presetKey}
              type="button"
              title={`${row.labelFr} · ${row.techCode}${isDefault ? " · défaut boutique" : ""}`}
              aria-label={`${row.labelFr}, code ${row.techCode}`}
              aria-pressed={active}
              onClick={() => onToggle(row.presetKey)}
              className={`group flex min-w-0 items-center gap-1.5 rounded-md border px-1.5 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/40 ${
                isDefault
                  ? "border-white bg-white/[0.12] ring-2 ring-white/25"
                  : active
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
        {customDeclinations.map((color) => {
          const label = frenchLabelForColorPreset(color);
          const code = techCodeForColorPreset(color);
          const isDefault = isDefaultVariant(color);
          const swatchStyle = adminSwatchStyle(color) as CSSProperties;
          return (
            <div
              key={`custom-decl-${canonicalSelectionKey(color)}`}
              className={`flex min-w-0 items-stretch gap-0.5 rounded-md border border-dashed bg-violet-950/20 ${
                isDefault
                  ? "border-white/45 ring-2 ring-white/20"
                  : "border-violet-300/35 ring-1 ring-violet-400/15"
              }`}
            >
              <button
                type="button"
                title={`${label} · ${code} · perso${isDefault ? " · défaut boutique" : ""}`}
                aria-label={`${label}, couleur personnalisée, code ${code}`}
                aria-pressed
                onClick={() => onActivateColor(color)}
                className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-l-md px-1.5 py-1 text-left transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/40"
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-white/30"
                  style={swatchStyle}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[11px] font-medium text-white">{label}</span>
                  <span className="mt-0.5 block truncate font-mono text-[8px] uppercase tracking-wide text-violet-200/45">
                    {code}
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label={`Supprimer ${label}`}
                title="Supprimer cette couleur"
                onClick={() => requestRemoveColor(color)}
                className="shrink-0 rounded-r-md border-l border-violet-300/20 px-1.5 text-[14px] leading-none text-white/45 transition hover:bg-red-500/15 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/35"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && showBackend ? (
        <footer className="rounded-lg border border-white/10 bg-[#0a1020]/60 px-2 py-1.5">
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