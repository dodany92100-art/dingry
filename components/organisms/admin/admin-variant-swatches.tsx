"use client";

import { ADMIN_VARIANT_PRESETS, isPantsCategory } from "@/lib/admin/product-variant-presets";
import { swatchHexForVariant } from "@/lib/admin/smart-crm";
import type { ProductCategory } from "@/lib/admin/types";

type AdminVariantSwatchesProps = {
  category: ProductCategory;
  value: string;
  selected?: readonly string[];
  multiple?: boolean;
  onChange: (variant: string) => void;
  onToggle?: (preset: string) => void;
};

export function AdminVariantSwatches({
  category,
  value,
  selected,
  multiple = false,
  onChange,
  onToggle,
}: AdminVariantSwatchesProps) {
  const presets = ADMIN_VARIANT_PRESETS[category];
  const pants = isPantsCategory(category);
  const fromSelected = (selected ?? []).map((item) => item.trim().toUpperCase()).filter(Boolean);
  const selectedKeys =
    fromSelected.length > 0
      ? fromSelected
      : [value.trim().toUpperCase()].filter(Boolean);

  return (
    <div className="mt-2 flex flex-wrap gap-2.5">
      {presets.map((preset) => {
        const active = pants
          ? multiple
            ? selectedKeys.includes(preset)
            : value.trim() === preset
          : selectedKeys.includes(preset.toUpperCase());
        const hex = pants ? null : swatchHexForVariant(preset);

        return (
          <button
            key={preset}
            type="button"
            onClick={() => {
              if (multiple && onToggle) onToggle(preset);
              else onChange(preset);
            }}
            title={preset}
            className={`group flex flex-col items-center gap-1.5 rounded-sm px-1 py-1 transition ${
              active ? "opacity-100" : "opacity-70 hover:opacity-100"
            }`}
          >
            <span
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                active ? "border-white shadow-[0_0_12px_rgba(255,255,255,0.35)]" : "border-zinc-700"
              }`}
              style={
                hex
                  ? { backgroundColor: hex }
                  : { backgroundColor: "#27272a", color: "#fafafa", fontSize: "10px" }
              }
            >
              {pants ? preset : null}
              {!hex && !pants ? (
                <span className="text-[8px] font-semibold uppercase tracking-tight">{preset.slice(0, 2)}</span>
              ) : null}
            </span>
            <span
              className={`max-w-[4.5rem] truncate text-[8px] uppercase tracking-[0.1em] ${
                active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
              }`}
            >
              {preset}
            </span>
          </button>
        );
      })}
    </div>
  );
}
