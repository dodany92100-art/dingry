"use client";

import {
  ATELIER_CITY_TOP_SLIDER,
  formatCityTopPercent,
  parseCityTopPercent,
} from "@/lib/atelier-custom-config";

type AtelierCityTopSliderProps = {
  id: string;
  value: string;
  onChange: (cityTop: string) => void;
  className?: string;
  /** Variante sombre (admin) ou claire (modale boutique). */
  tone?: "dark" | "light";
};

export function AtelierCityTopSlider({
  id,
  value,
  onChange,
  className = "",
  tone = "light",
}: AtelierCityTopSliderProps) {
  const pct = parseCityTopPercent(value);
  const labelClass =
    tone === "dark"
      ? "text-[10px] font-medium uppercase tracking-[0.16em] text-white/45"
      : "text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500";
  const valueClass = tone === "dark" ? "text-white/80" : "text-neutral-800";

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className={`flex items-center justify-between gap-3 ${labelClass}`}>
        <span>Position du texte (vertical)</span>
        <span className={`tabular-nums ${valueClass}`}>{formatCityTopPercent(pct)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={ATELIER_CITY_TOP_SLIDER.min}
        max={ATELIER_CITY_TOP_SLIDER.max}
        step={ATELIER_CITY_TOP_SLIDER.step}
        value={pct}
        onChange={(e) => onChange(formatCityTopPercent(Number(e.target.value)))}
        className="dingry-atelier-range w-full touch-manipulation"
        aria-valuemin={ATELIER_CITY_TOP_SLIDER.min}
        aria-valuemax={ATELIER_CITY_TOP_SLIDER.max}
        aria-valuenow={pct}
        aria-valuetext={formatCityTopPercent(pct)}
      />
    </div>
  );
}
