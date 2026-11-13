"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShopCustomerOrder } from "@/lib/shop/customer-orders";

type ShopOrdersState = {
  orders: ShopCustomerOrder[];
  loading: boolean;
  error: string | null;
};

export function useShopOrders(accessToken: string | null | undefined, enabled: boolean) {
  const [state, setState] = useState<ShopOrdersState>({
    orders: [],
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!accessToken || !enabled) {
      setState({ orders: [], loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/shop/orders", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await response.json().catch(() => null)) as {
        orders?: ShopCustomerOrder[];
        error?: string;
      } | null;
      if (!response.ok || !payload?.orders) {
        setState({
          orders: [],
          loading: false,
          error: payload?.error ?? "Historique indisponible.",
        });
        return;
      }
      setState({ orders: payload.orders, loading: false, error: null });
    } catch {
      setState({ orders: [], loading: false, error: "Historique indisponible." });
    }
  }, [accessToken, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
