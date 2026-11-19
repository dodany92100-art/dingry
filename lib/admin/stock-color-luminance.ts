import { adminSwatchHex } from "@/lib/admin/dingry-color-palette";
import type { AdminProduct } from "@/lib/admin/types";

export type StockColorSortMode = "default" | "light" | "dark";

function relativeLuminanceFromHex(hex: string): number {
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (h.length !== 6) return 0.42;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return 0.42;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Luminosité perçue (variante active, puis déclinaisons). */
export function productPerceivedLuminance(product: AdminProduct): number {
  const keys = [product.variant, ...product.colorDeclinations]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  for (const key of keys) {
    const hex = adminSwatchHex(key);
    if (hex) return relativeLuminanceFromHex(hex);
  }
  return 0.42;
}

export function sortProductsByColorLuminance(
  products: readonly AdminProduct[],
  mode: Exclude<StockColorSortMode, "default">,
): AdminProduct[] {
  return [...products].sort((a, b) => {
    const la = productPerceivedLuminance(a);
    const lb = productPerceivedLuminance(b);
    if (la === lb) return a.id.localeCompare(b.id);
    if (mode === "light") return lb - la;
    return la - lb;
  });
}

export function cycleStockColorSortMode(mode: StockColorSortMode): StockColorSortMode {
  if (mode === "default") return "light";
  if (mode === "light") return "dark";
  return "default";
}