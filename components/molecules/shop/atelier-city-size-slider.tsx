"use client";

import {
  ATELIER_CITY_SIZE_SLIDER,
  formatCitySizeClamp,
  parseCitySizeMaxRem,
} from "@/lib/atelier-custom-config";

type AtelierCitySizeSliderProps = {
  id: string;
  citySize: string;
  onChange: (citySize: string) => void;
  className?: string;
  tone?: "dark" | "light";
};

export function AtelierCitySizeSlider({
  id,
  citySize,
  onChange,
  className = "",
  tone = "light",
}: AtelierCitySizeSliderProps) {
  const rem = parseCitySizeMaxRem(citySize);
  const labelClass =
    tone === "dark"
      ? "text-[10px] font-medium uppercase tracking-[0.16em] text-white/45"
      : "text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500";
  const valueClass = tone === "dark" ? "text-white/80" : "text-neutral-800";

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className={`flex items-center justify-between gap-3 ${labelClass}`}>
        <span>Taille du texte</span>
        <span className={`tabular-nums ${valueClass}`}>{rem.toFixed(2)} rem</span>
      </label>
      <input
        id={id}
        type="range"
        min={ATELIER_CITY_SIZE_SLIDER.min}
        max={ATELIER_CITY_SIZE_SLIDER.max}
        step={ATELIER_CITY_SIZE_SLIDER.step}
        value={rem}
        onChange={(e) => onChange(formatCitySizeClamp(Number(e.target.value)))}
        className="dingry-atelier-range w-full touch-manipulation"
        aria-valuemin={ATELIER_CITY_SIZE_SLIDER.min}
        aria-valuemax={ATELIER_CITY_SIZE_SLIDER.max}
        aria-valuenow={rem}
        aria-valuetext={`${rem.toFixed(2)} rem`}
      />
    </div>
  );
}
