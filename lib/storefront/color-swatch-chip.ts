import type { CSSProperties } from "react";
import { adminSwatchHex, adminSwatchStyle } from "@/lib/admin/dingry-color-palette";

function isLightSwatch(raw: string, hex: string): boolean {
  const key = raw.trim().toUpperCase();
  return (
    key === "BLANC" ||
    key === "WHITE" ||
    hex.toLowerCase() === "#f4f4f5" ||
    hex.toLowerCase() === "#fafaf9" ||
    hex.toLowerCase() === "#ffffff"
  );
}

/** Style inline pour chip couleur modale boutique (fond = teinte réelle). */
export function colorSwatchChipStyle(...candidates: string[]): CSSProperties {
  const raw = candidates.map((v) => v.trim()).find((v) => v.length > 0) ?? "";
  const base = adminSwatchStyle(raw);
  const hex = adminSwatchHex(raw) ?? base.backgroundColor;
  const light = isLightSwatch(raw, hex);
  return {
    backgroundColor: base.backgroundColor,
    boxShadow: base.boxShadow,
    color: light ? "#161616" : "#ffffff",
    borderColor: light ? "rgba(120,113,108,0.5)" : "rgba(0,0,0,0.2)",
  };
}
