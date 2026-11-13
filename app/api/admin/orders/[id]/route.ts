import { requireAdmin } from "@/lib/admin/auth";
import { patchOrder, findOrder, StoreConflictError, StoreUnavailableError } from "@/lib/admin/store";
import {
  planFulfillmentPatch,
  statusChangeBlocked,
  type FulfillmentPatchBody,
} from "@/lib/admin/order-fulfillment-patch";
import { nextOrderStatus } from "@/lib/admin/order-status";
import {
  isOrderReviewReason,
  isShippingAddressMissing,
  resolveReviewReason,
  type OrderReviewReason,
} from "@/lib/order-review";
import type { OrderStatus } from "@/lib/admin/types";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

function parseReviewReason(value: unknown): OrderReviewReason | null {
  return typeof value === "string" && isOrderReviewReason(value) ? value : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const current = await findOrder(id);
  if (!current) {
    return jsonNoStore({ error: "Commande introuvable." }, { status: 404 });
  }

  let body: FulfillmentPatchBody & { status?: unknown; resolveReview?: unknown };
  try {
    body = (await request.json()) as FulfillmentPatchBody & { status?: unknown; resolveReview?: unknown };
  } catch {
    return jsonNoStore({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const resolveReason = parseReviewReason(body.resolveReview);
  if (resolveReason) {
    try {
      const { order, changed } = await patchOrder(id, (snapshot) =>
        resolveReviewReason(snapshot, resolveReason),
      );
      if (!order) {
        return jsonNoStore({ error: "Commande introuvable." }, { status: 404 });
      }
      if (!changed) {
        if (!(order.reviewReasons ?? []).includes(resolveReason)) {
          return jsonNoStore({ order });
        }
        if (resolveReason === "stock" && !order.stockApplied) {
          return jsonNoStore(
            {
              error:
                "Stock non appliqué : corrigez le stock ou attendez la finalisation avant de retirer le motif.",
            },
            { status: 400 },
          );
        }
        if (resolveReason === "adresse" && isShippingAddressMissing(order.shippingAddress)) {
          return jsonNoStore({ error: "Renseignez l'adresse de livraison avant de retirer le motif." }, { status: 400 });
        }
        return jsonNoStore({ order });
      }
      return jsonNoStore({ order });
    } catch (error) {
      if (error instanceof StoreUnavailableError) {
        return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
      }
      if (error instanceof StoreConflictError) {
        return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
      }
      console.error("Commande admin", error instanceof Error ? error.name : "erreur");
      return jsonNoStore({ error: "Impossible de mettre à jour la commande." }, { status: 500 });
    }
  }

  const hasTrackingChange =
    body.trackingNumber !== undefined || body.clearTracking === true;
  const hasExplicitStatus = body.status !== undefined;

  if (!hasTrackingChange && !hasExplicitStatus && Object.keys(body).length === 0) {
    let nextStatus: OrderStatus;
    if (current.status === "À vérifier") {
      return jsonNoStore(
        { error: "Commande à vérifier : indiquez un statut explicitement ou resolveReview." },
        { status: 400 },
      );
    }
    nextStatus = nextOrderStatus(current.status);
    if (nextStatus === current.status) {
      return jsonNoStore({ order: current });
    }
    if (statusChangeBlocked(current, nextStatus)) {
      if (nextStatus === "Expédiée" && current.stockPending) {
        return jsonNoStore(
          { error: "Stock encore en attente : impossible d'expédier." },
          { status: 400 },
        );
      }
      return jsonNoStore(
        { error: "Résolvez les motifs (resolveReview) avant de changer le statut." },
        { status: 400 },
      );
    }
    try {
      const { order, changed } = await patchOrder(id, () => ({ status: nextStatus }));
      if (!order) return jsonNoStore({ error: "Commande introuvable." }, { status: 404 });
      if (!changed) return jsonNoStore({ order });
      return jsonNoStore({ order });
    } catch (error) {
      if (error instanceof StoreUnavailableError) {
        return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
      }
      if (error instanceof StoreConflictError) {
        return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
      }
      console.error("Commande admin", error instanceof Error ? error.name : "erreur");
      return jsonNoStore({ error: "Impossible de mettre à jour la commande." }, { status: 500 });
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
      const merge = { ...planned.patch };
      if (merge.status && merge.status !== snap.status) {
        if (statusChangeBlocked(snap, merge.status as OrderStatus)) {
          return {};
        }
      }
      return merge;
    });
    if (!order) {
      return jsonNoStore({ error: "Commande introuvable." }, { status: 404 });
    }
    if (!changed && planned.patch.status && order.status !== planned.patch.status) {
      if (statusChangeBlocked(order, planned.patch.status)) {
        return jsonNoStore(
          { error: "Résolvez les motifs (resolveReview) avant de changer le statut." },
          { status: 400 },
        );
      }
    }
    return jsonNoStore({ order });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    console.error("Commande admin", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Impossible de mettre à jour la commande." }, { status: 500 });
  }
}
