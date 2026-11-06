import type { AdminProduct } from "@/lib/admin/types";

export type StockStatusLabel = "EN LIGNE" | "BROUILLON" | "ÉPUISÉ";

export function resolveStockStatusLabel(product: AdminProduct): StockStatusLabel {
  if (product.publishStatus === "draft") return "BROUILLON";
  if (product.stock <= 0) return "ÉPUISÉ";
  return "EN LIGNE";
}

const BADGE_STYLES: Record<StockStatusLabel, string> = {
  "EN LIGNE": "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.35)]",
  BROUILLON: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/40",
  ÉPUISÉ: "bg-red-500/20 text-red-300 ring-1 ring-red-400/50 shadow-[0_0_14px_rgba(248,113,113,0.35)]",
};

type AdminStockStatusBadgeProps = {
  product: AdminProduct;
  className?: string;
};

export function AdminStockStatusBadge({ product, className = "" }: AdminStockStatusBadgeProps) {
  const label = resolveStockStatusLabel(product);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${BADGE_STYLES[label]} ${className}`}
    >
      {label}
    </span>
  );
}
