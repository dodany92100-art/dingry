import type { AdminOrder, OrderStatus } from "@/lib/admin/types";
import { FULFILLMENT_STATUSES, ORDER_STATUSES } from "@/lib/admin/types";

const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  "En attente": "Payée",
  Expédié: "Expédiée",
  Livré: "Livrée",
};

export function normalizeOrderStatus(value: unknown): OrderStatus {
  const raw = String(value ?? "").trim();
  const legacy = LEGACY_STATUS_MAP[raw];
  if (legacy) return legacy;
  if ((ORDER_STATUSES as readonly string[]).includes(raw)) {
    return raw as OrderStatus;
  }
  return "Payée";
}

export function normalizeAdminOrder(order: AdminOrder): AdminOrder {
  return {
    ...order,
    status: normalizeOrderStatus(order.status),
    ...(order.trackingNumber
      ? { trackingNumber: normalizeTrackingNumber(order.trackingNumber) ?? undefined }
      : {}),
  };
}

export function normalizeTrackingNumber(value: unknown): string | null {
  if (value === null || value === "") return null;
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 120);
}

export function parseOrderStatusInput(value: unknown): OrderStatus | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeOrderStatus(value);
  return (ORDER_STATUSES as readonly string[]).includes(normalized) ? normalized : null;
}

/** Libellé vitrine client (masque le statut interne ops). */
export function customerOrderStatusLabel(status: OrderStatus): string {
  if (status === "À vérifier") return "En cours de vérification";
  return status;
}

export function shopOrderStatusBadgeClass(status: OrderStatus): string {
  if (status === "À vérifier") return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  if (status === "Livrée") return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
  if (status === "Expédiée") return "border-[#FF3D00]/40 bg-[#FF3D00]/15 text-[#ff9a6b]";
  if (status === "En préparation") return "border-sky-400/30 bg-sky-500/10 text-sky-100";
  return "border-white/20 bg-white/[0.08] text-white/85";
}

export function nextOrderStatus(status: OrderStatus): OrderStatus {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "À vérifier") return normalized;
  const index = FULFILLMENT_STATUSES.indexOf(normalized);
  if (index < 0) return "Payée";
  return FULFILLMENT_STATUSES[(index + 1) % FULFILLMENT_STATUSES.length] ?? "Payée";
}
