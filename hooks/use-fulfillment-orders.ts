"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminOrder, OrderStatus } from "@/lib/admin/types";

type State = {
  orders: AdminOrder[];
  loading: boolean;
  error: string;
  busyOrderId: string | null;
};

export function useFulfillmentOrders(accessToken: string | null | undefined, enabled: boolean) {
  const [state, setState] = useState<State>({
    orders: [],
    loading: false,
    error: "",
    busyOrderId: null,
  });

  const load = useCallback(async () => {
    if (!accessToken || !enabled) {
      setState((prev) => ({ ...prev, orders: [], loading: false }));
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await fetch("/api/shop/fulfillment/orders", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = (await response.json().catch(() => null)) as { orders?: AdminOrder[]; error?: string } | null;
      if (!response.ok || !data?.orders) {
        setState((prev) => ({
          ...prev,
          orders: [],
          loading: false,
          error: data?.error ?? "Chargement impossible.",
        }));
        return;
      }
      setState((prev) => ({ ...prev, orders: data.orders ?? [], loading: false, error: "" }));
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: "Chargement impossible." }));
    }
  }, [accessToken, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback(
    async (orderId: string, body: Record<string, unknown>) => {
      if (!accessToken) return;
      setState((prev) => ({ ...prev, busyOrderId: orderId, error: "" }));
      try {
        const response = await fetch(`/api/shop/fulfillment/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        const data = (await response.json().catch(() => null)) as { order?: AdminOrder; error?: string } | null;
        if (!response.ok || !data?.order) {
          setState((prev) => ({
            ...prev,
            busyOrderId: null,
            error: data?.error ?? "Mise à jour impossible.",
          }));
          return;
        }
        setState((prev) => ({
          ...prev,
          busyOrderId: null,
          orders: prev.orders.map((item) => (item.id === orderId ? data.order! : item)),
        }));
      } catch {
        setState((prev) => ({ ...prev, busyOrderId: null, error: "Mise à jour impossible." }));
      }
    },
    [accessToken],
  );

  const cycleStatus = useCallback(
    (order: AdminOrder) => {
      void patch(order.id, {});
    },
    [patch],
  );

  const setStatus = useCallback(
    (order: AdminOrder, status: OrderStatus) => {
      void patch(order.id, { status });
    },
    [patch],
  );

  const saveTracking = useCallback(
    (order: AdminOrder, trackingNumber: string) => {
      void patch(order.id, trackingNumber ? { trackingNumber } : { clearTracking: true });
    },
    [patch],
  );

  return { ...state, reload: load, cycleStatus, setStatus, saveTracking };
}
