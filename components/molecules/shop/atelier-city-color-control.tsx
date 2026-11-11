"use client";

import {
  ATELIER_CITY_COLOR_PRESETS,
  atelierCityColorPresetsForModel,
  isAtelierCityColorAllowedForModel,
  normalizeAtelierCityColor,
} from "@/lib/atelier-custom-config";

type AtelierCityColorControlProps = {
  id: string;
  value: string;
  onChange: (color: string) => void;
  className?: string;
  tone?: "dark" | "light";
  /** Filtre les pastilles selon le tee (ex. pas de blanc sur tee blanc). */
  modelId?: string;
  /** Aligne le libellé et les pastilles au centre (mobile sheet). */
  centered?: boolean;
};

export function AtelierCityColorControl({
  id,
  value,
  onChange,
  className = "",
  tone = "light",
  modelId,
  centered = false,
}: AtelierCityColorControlProps) {
  const presets = modelId ? atelierCityColorPresetsForModel(modelId) : [...ATELIER_CITY_COLOR_PRESETS];
  const pickColor = (raw: string) => {
    const hex = normalizeAtelierCityColor(raw);
    if (!hex) return;
    if (modelId && !isAtelierCityColorAllowedForModel(modelId, hex)) return;
    onChange(hex);
  };
  const normalized = normalizeAtelierCityColor(value) || presets[0]?.color || "#000000";
  const labelClass =
    tone === "dark"
      ? "text-[10px] font-medium uppercase tracking-[0.16em] text-white/45"
      : "text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500";

  return (
    <div className={`space-y-2 ${className}`}>
      <p className={labelClass}>Couleur du texte</p>
      <div className={`flex flex-wrap items-center gap-2 ${centered ? "justify-center" : ""}`}>
        {presets.map((preset) => {
          const active = normalized === preset.color;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              onClick={() => pickColor(preset.color)}
              onPointerDown={(event) => {
                if (event.pointerType === "touch") pickColor(preset.color);
              }}
              className={`flex h-9 min-w-9 touch-manipulation items-center justify-center rounded-full border px-2.5 text-[9px] font-medium uppercase tracking-[0.12em] transition-[border-color,box-shadow] duration-[45ms] ease-out ${
                active
                  ? "border-[#bf953f] ring-1 ring-[#bf953f]/50"
                  : tone === "dark"
                    ? "border-white/15 text-white/55"
                    : "border-black/12 text-neutral-600"
              }`}
              title={preset.label}
            >
              <span
                className="size-4 shrink-0 rounded-full border border-black/15"
                style={{ backgroundColor: preset.color }}
                aria-hidden
              />
              <span className="sr-only">{preset.label}</span>
            </button>
          );
        })}
        <label
          htmlFor={`${id}-picker`}
          className={`dingry-interactive-luxe relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border ${
            tone === "dark" ? "border-white/20" : "border-black/12"
          }`}
          title="Couleur personnalisée"
        >
          <span
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from 0deg, #ff3d00, #d4af37, #fff, #000, #ff3d00)`,
            }}
            aria-hidden
          />
          <input
            id={`${id}-picker`}
            type="color"
            value={normalized.length === 7 ? normalized : "#000000"}
            onChange={(e) => pickColor(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
