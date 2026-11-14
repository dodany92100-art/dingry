import type { OrderStatus } from "@/lib/admin/types";

/** Immatriculation fiche stock liste (#05, #35…). */
export function adminStockIdLabel(id: string | number): string {
  const raw = String(id).trim();
  if (!raw) return "";
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 0) return `#${String(n).padStart(2, "0")}`;
  return `#${raw}`;
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString("fr-FR")}€`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date);
}

export function statusClass(status: OrderStatus): string {
  if (status === "À vérifier") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (status === "Expédiée") return "border-[#FF3D00]/40 bg-[#FF3D00]/15 text-[#ff8a4d]";
  if (status === "Livrée") return "border-white/20 bg-white/10 text-white";
  if (status === "En préparation") return "border-sky-500/35 bg-sky-500/10 text-sky-200";
  return "border-white/10 bg-white/[0.04] text-white/55";
}
