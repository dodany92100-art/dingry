import type { AdminOrder } from "@/lib/admin/types";

export const ORDER_REVIEW_REASONS = ["stock", "adresse"] as const;

export type OrderReviewReason = (typeof ORDER_REVIEW_REASONS)[number];

export function isOrderReviewReason(value: string): value is OrderReviewReason {
  return (ORDER_REVIEW_REASONS as readonly string[]).includes(value);
}

export function mergeReviewReasons(
  current: OrderReviewReason[] | undefined,
  add: OrderReviewReason,
): OrderReviewReason[] {
  const next = new Set<OrderReviewReason>(current ?? []);
  next.add(add);
  return ORDER_REVIEW_REASONS.filter((reason) => next.has(reason));
}

export function isShippingAddressMissing(address: string | undefined): boolean {
  return (address?.trim() ?? "").length === 0;
}

/** Marque « À vérifier » sans écraser un motif déjà posé (stock + adresse cumulables). */
export function patchForReviewReason(
  current: AdminOrder,
  reason: OrderReviewReason,
): Partial<AdminOrder> {
  const reviewReasons = mergeReviewReasons(current.reviewReasons, reason);
  if (current.status === "À vérifier") {
    return { reviewReasons };
  }
  if (current.status === "Payée" || current.status === "En préparation") {
    return { status: "À vérifier", reviewReasons };
  }
  return { reviewReasons };
}

/** Retire un motif ; si plus aucun motif et statut « À vérifier », repasse en « Payée ». */
export function resolveReviewReason(
  current: AdminOrder,
  reason: OrderReviewReason,
): Partial<AdminOrder> {
  if (!(current.reviewReasons ?? []).includes(reason)) {
    return {};
  }
  if (reason === "stock" && !current.stockApplied) {
    return {};
  }
  if (reason === "adresse" && isShippingAddressMissing(current.shippingAddress)) {
    return {};
  }

  const remaining = (current.reviewReasons ?? []).filter((item) => item !== reason);
  const reviewReasons =
    remaining.length > 0
      ? ORDER_REVIEW_REASONS.filter((item) => remaining.includes(item))
      : undefined;
  if (current.status === "À vérifier" && remaining.length === 0) {
    return { reviewReasons: undefined, status: "Payée" };
  }
  return { reviewReasons };
}

export function formatReviewReasons(reasons: OrderReviewReason[] | undefined): string {
  if (!reasons?.length) return "";
  const labels: Record<OrderReviewReason, string> = {
    stock: "stock",
    adresse: "adresse",
  };
  return reasons.map((reason) => labels[reason]).join(" · ");
}
