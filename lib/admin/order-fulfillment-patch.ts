import type { AdminOrder, OrderStatus } from "@/lib/admin/types";
import { normalizeOrderStatus, normalizeTrackingNumber, parseOrderStatusInput } from "@/lib/admin/order-status";

export function statusChangeBlocked(order: AdminOrder, nextStatus: OrderStatus): boolean {
  if (order.status === nextStatus) return false;
  if (
    order.status === "À vérifier" &&
    nextStatus !== "À vérifier" &&
    (order.reviewReasons?.length ?? 0) > 0
  ) {
    return true;
  }
  if (nextStatus === "Expédiée" && order.stockPending) {
    return true;
  }
  return false;
}

export type FulfillmentPatchBody = {
  status?: unknown;
  trackingNumber?: unknown;
  clearTracking?: unknown;
};

export function planFulfillmentPatch(
  current: AdminOrder,
  body: FulfillmentPatchBody,
): { patch: Partial<AdminOrder>; error?: string; status?: number } {
  const patch: Partial<AdminOrder> = {};
  const currentStatus = normalizeOrderStatus(current.status);

  if (body.clearTracking === true) {
    patch.trackingNumber = undefined;
  } else if (body.trackingNumber !== undefined) {
    const tracking = normalizeTrackingNumber(body.trackingNumber);
    if (tracking === null && body.trackingNumber !== null && body.trackingNumber !== "") {
      return { patch: {}, error: "Numéro de suivi invalide.", status: 400 };
    }
    patch.trackingNumber = tracking ?? undefined;
  }

  const requestedStatus = body.status !== undefined ? parseOrderStatusInput(body.status) : undefined;
  if (body.status !== undefined && !requestedStatus) {
    return { patch: {}, error: "Statut invalide.", status: 400 };
  }

  let nextStatus: OrderStatus | undefined;
  if (requestedStatus) {
    nextStatus = requestedStatus;
  } else if (body.status === undefined) {
    nextStatus = undefined;
  }

  if (nextStatus && nextStatus !== currentStatus) {
    if (statusChangeBlocked({ ...current, status: currentStatus }, nextStatus)) {
      if (nextStatus === "Expédiée" && current.stockPending) {
        return {
          patch: {},
          error: "Stock encore en attente : impossible d'expédier.",
          status: 400,
        };
      }
      return {
        patch: {},
        error: "Résolvez les motifs de vérification avant de changer le statut.",
        status: 400,
      };
    }
    patch.status = nextStatus;
  }

  if (Object.keys(patch).length === 0) {
    return { patch: {} };
  }
  return { patch };
}
