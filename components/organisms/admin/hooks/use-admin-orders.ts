"use client";

import { useCallback, useState } from "react";
import type { AdminOrder, OrderStatus } from "@/lib/admin/types";
import type { OrderReviewReason } from "@/lib/order-review";
import type { LoadResult } from "./use-admin-products";

type Options = { onUnauthorized: () => void };

export function useAdminOrders({ onUnauthorized }: Options) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState("");

  const load = useCallback(async (): Promise<LoadResult> => {
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      if (response.status === 401) return "unauthorized";
      if (!response.ok) return "error";
      const data = (await response.json()) as { orders: AdminOrder[] };
      setOrders(data.orders);
      return "ok";
    } catch {
      return "error";
    }
  }, []);

  const reset = useCallback(() => {
    setOrders([]);
    setOrderError("");
  }, []);

  /** Avance le statut : PATCH orders/[id] avec {} (le serveur choisit le suivant et applique ses garde-fous). */
  const cycleStatus = useCallback(
    async (order: AdminOrder) => {
      setOrderError("");
      setBusyOrderId(order.id);
      try {
        const response = await fetch(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        const data = (await response.json().catch(() => ({}))) as {
          order?: AdminOrder;
          error?: string;
        };
        const updated = data.order;
        if (response.ok && updated) {
          setOrders((current) => current.map((item) => (item.id === order.id ? updated : item)));
        } else {
          setOrderError(data.error || "Statut non modifié.");
        }
      } catch {
        setOrderError("Statut non modifié.");
      } finally {
        setBusyOrderId(null);
      }
    },
    [onUnauthorized],
  );

  const patchOrderFields = useCallback(
    async (order: AdminOrder, body: Record<string, unknown>) => {
      setOrderError("");
      setBusyOrderId(order.id);
      try {
        const response = await fetch(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        const data = (await response.json().catch(() => ({}))) as {
          order?: AdminOrder;
          error?: string;
        };
        const updated = data.order;
        if (response.ok && updated) {
          setOrders((current) => current.map((item) => (item.id === order.id ? updated : item)));
        } else {
          setOrderError(data.error || "Mise à jour impossible.");
        }
      } catch {
        setOrderError("Mise à jour impossible.");
      } finally {
        setBusyOrderId(null);
      }
    },
    [onUnauthorized],
  );

  const setStatus = useCallback(
    async (order: AdminOrder, status: OrderStatus) => {
      await patchOrderFields(order, { status });
    },
    [patchOrderFields],
  );

  const saveTracking = useCallback(
    async (order: AdminOrder, trackingNumber: string) => {
      await patchOrderFields(
        order,
        trackingNumber ? { trackingNumber } : { clearTracking: true },
      );
    },
    [patchOrderFields],
  );

  const resolveReview = useCallback(
    async (order: AdminOrder, reason: OrderReviewReason) => {
      setOrderError("");
      setBusyOrderId(order.id);
      try {
        const response = await fetch(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolveReview: reason }),
        });
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        const data = (await response.json().catch(() => ({}))) as {
          order?: AdminOrder;
          error?: string;
        };
        const updated = data.order;
        if (response.ok && updated) {
          setOrders((current) => current.map((item) => (item.id === order.id ? updated : item)));
        } else {
          setOrderError(data.error || "Motif non retiré.");
        }
      } catch {
        setOrderError("Motif non retiré.");
      } finally {
        setBusyOrderId(null);
      }
    },
    [onUnauthorized],
  );

  return { orders, busyOrderId, orderError, load, reset, cycleStatus, setStatus, saveTracking, resolveReview };
}
