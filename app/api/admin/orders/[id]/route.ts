import { requireAdmin } from "@/lib/admin/auth";
import { patchOrder, findOrder, StoreConflictError, StoreUnavailableError } from "@/lib/admin/store";
import {
  isOrderReviewReason,
  isShippingAddressMissing,
  resolveReviewReason,
  type OrderReviewReason,
} from "@/lib/order-review";
import { isOrderStatus, nextOrderStatus, type AdminOrder, type OrderStatus } from "@/lib/admin/types";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

function parseReviewReason(value: unknown): OrderReviewReason | null {
  return typeof value === "string" && isOrderReviewReason(value) ? value : null;
}

function statusChangeBlocked(order: AdminOrder, nextStatus: OrderStatus): boolean {
  if (order.status === nextStatus) return false;
  if (
    order.status === "À vérifier" &&
    nextStatus !== "À vérifier" &&
    (order.reviewReasons?.length ?? 0) > 0
  ) {
    return true;
  }
  if (nextStatus === "Expédié" && order.stockPending) {
    return true;
  }
  return false;
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

  let body: { status?: unknown; resolveReview?: unknown };
  try {
    body = (await request.json()) as { status?: unknown; resolveReview?: unknown };
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

  const requestedStatus =
    typeof body.status === "string" && isOrderStatus(body.status) ? body.status : undefined;

  let nextStatus: OrderStatus;
  if (requestedStatus) {
    nextStatus = requestedStatus;
  } else if (current.status === "À vérifier") {
    return jsonNoStore(
      { error: "Commande à vérifier : indiquez un statut explicitement ou resolveReview." },
      { status: 400 },
    );
  } else {
    nextStatus = nextOrderStatus(current.status);
  }

  if (nextStatus === current.status) {
    return jsonNoStore({ order: current });
  }

  try {
    const { order, changed } = await patchOrder(id, (snap) => {
      if (snap.status === nextStatus) return {};
      if (
        snap.status === "À vérifier" &&
        nextStatus !== "À vérifier" &&
        (snap.reviewReasons?.length ?? 0) > 0
      ) {
        return {};
      }
      if (nextStatus === "Expédié" && snap.stockPending) return {};
      return { status: nextStatus };
    });
    if (!order) {
      return jsonNoStore({ error: "Commande introuvable." }, { status: 404 });
    }
    if (!changed) {
      if (order.status === nextStatus) {
        return jsonNoStore({ order });
      }
      if (statusChangeBlocked(order, nextStatus)) {
        if (nextStatus === "Expédié" && order.stockPending) {
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
