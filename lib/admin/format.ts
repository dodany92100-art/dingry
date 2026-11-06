import type { OrderStatus } from "@/lib/admin/types";

export function formatPrice(value: number): string {
  return `${value.toLocaleString("fr-FR")}€`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusClass(status: OrderStatus): string {
  if (status === "À vérifier") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (status === "Expédié") return "border-[#0066FF]/40 bg-[#0066FF]/15 text-[#7EB3FF]";
  if (status === "Livré") return "border-white/20 bg-white/10 text-white";
  return "border-white/10 bg-white/[0.04] text-white/55";
}
