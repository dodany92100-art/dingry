import { findOrder, patchOrder, StoreConflictError, StoreUnavailableError } from "@/lib/admin/store";
import { planFulfillmentPatch, statusChangeBlocked, type FulfillmentPatchBody } from "@/lib/admin/order-fulfillment-patch";
import { nextOrderStatus } from "@/lib/admin/order-status";
import type { OrderStatus } from "@/lib/admin/types";
import { jsonNoStore } from "@/lib/http";
import { requireFulfillmentOwner } from "@/lib/shop/require-fulfillment-owner";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireFulfillmentOwner(request);
  if (gate.response) return gate.response;

  const { id } = await params;
  const current = await findOrder(id);
  if (!current || current.source !== "paypal") {
    return jsonNoStore({ error: "Commande introuvable." }, { status: 404 });
  }

  let body: FulfillmentPatchBody;
  try {
    body = (await request.json()) as FulfillmentPatchBody;
  } catch {
    return jsonNoStore({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const cycleOnly =
    Object.keys(body).length === 0 ||
    (body.status === undefined &&
      body.trackingNumber === undefined &&
      body.clearTracking !== true);

  if (cycleOnly) {
    const nextStatus = nextOrderStatus(current.status);
    if (nextStatus === current.status) {
      return jsonNoStore({ order: current });
    }
    if (statusChangeBlocked(current, nextStatus)) {
      return jsonNoStore({ error: "Impossible d'avancer le statut pour cette commande." }, { status: 400 });
    }
    try {
      const { order } = await patchOrder(id, () => ({ status: nextStatus }));
      return jsonNoStore({ order: order ?? current });
    } catch (error) {
      if (error instanceof StoreUnavailableError) {
        return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
      }
      if (error instanceof StoreConflictError) {
        return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
      }
      return jsonNoStore({ error: "Mise à jour impossible." }, { status: 500 });
    }
  }

  const planned = planFulfillmentPatch(current, body);
  if (planned.error) {
    return jsonNoStore({ error: planned.error }, { status: planned.status ?? 400 });
  }
  if (Object.keys(planned.patch).length === 0) {
    return jsonNoStore({ order: current });
  }

  try {
    const { order, changed } = await patchOrder(id, (snap) => {
      if (planned.patch.status && statusChangeBlocked(snap, planned.patch.status as OrderStatus)) {
        return {};
      }
      return planned.patch;
    });
    if (!order) return jsonNoStore({ error: "Commande introuvable." }, { status: 404 });
    if (!changed && planned.patch.status && order.status !== planned.patch.status) {
      return jsonNoStore({ error: "Statut non modifié." }, { status: 400 });
    }
    return jsonNoStore({ order });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    return jsonNoStore({ error: "Mise à jour impossible." }, { status: 500 });
  }
}
