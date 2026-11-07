"use client";

import { useCallback, useRef, useState } from "react";
import { publishDropBatchAction } from "@/app/actions/admin";
import type { DropBatchItem } from "@/lib/admin/drop-batch";
import type { AdminProduct } from "@/lib/admin/types";
import {
  applyDisplayOrderByIds,
  sortAdminProductsForDisplay,
} from "@/lib/admin/product-display-order";

function cloneProducts(list: AdminProduct[]): AdminProduct[] {
  return list.map((item) => ({ ...item }));
}

function buildDropBatchItems(
  products: AdminProduct[],
  publishDraftIds?: readonly string[],
): DropBatchItem[] {
  const publishSet = publishDraftIds ? new Set(publishDraftIds.map(String)) : null;
  return sortAdminProductsForDisplay(products).map((product) => ({
    id: product.id,
    displayOrder: product.displayOrder,
    ...(publishSet?.has(product.id) ? { status: "published" as const } : {}),
  }));
}

export type LoadResult = "ok" | "unauthorized" | "error";
export type SaveProductResult = { product: AdminProduct } | { error: string };

type Options = { onUnauthorized: () => void };

export function useAdminProducts({ onUnauthorized }: Options) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [stockError, setStockError] = useState("");
  const [orderDirty, setOrderDirty] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [gridValidated, setGridValidated] = useState(false);
  const [publishSaving, setPublishSaving] = useState(false);
  const orderBaselineRef = useRef<AdminProduct[]>([]);

  const syncOrderBaseline = useCallback((list: AdminProduct[]) => {
    orderBaselineRef.current = cloneProducts(list);
    setOrderDirty(false);
  }, []);

  const clearGridValidated = useCallback(() => {
    setGridValidated(false);
  }, []);

  const load = useCallback(async (): Promise<LoadResult> => {
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      if (response.status === 401) return "unauthorized";
      if (!response.ok) return "error";
      const data = (await response.json()) as { products: AdminProduct[] };
      setProducts(data.products);
      syncOrderBaseline(data.products);
      return "ok";
    } catch {
      return "error";
    }
  }, [syncOrderBaseline]);

  const reset = useCallback(() => {
    setProducts([]);
    setStockError("");
    orderBaselineRef.current = [];
    setOrderDirty(false);
    setOrderSaving(false);
    setGridValidated(false);
    setPublishSaving(false);
  }, []);

  /** Création (POST multipart) ou modification (PATCH multipart). Stock absolu autorisé via `stock`. */
  const save = useCallback(
    async (editingId: string | null, formData: FormData): Promise<SaveProductResult> => {
      async function postOnce(): Promise<SaveProductResult> {
        try {
          const response = await fetch(
            editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
            { method: editingId ? "PATCH" : "POST", body: formData },
          );
          if (response.status === 401) {
            onUnauthorized();
            return { error: "Session expirée." };
          }
          const data = (await response.json().catch(() => ({}))) as {
            product?: AdminProduct;
            error?: string;
          };
          const saved = data.product;
          if (!response.ok || !saved) {
            return { error: data.error || "Impossible d'enregistrer le produit." };
          }
          setProducts((current) =>
            editingId
              ? current.map((item) => (item.id === editingId ? saved : item))
              : [saved, ...current],
          );
          return { product: saved };
        } catch {
          return { error: "Impossible d'enregistrer le produit." };
        }
      }

      let last = await postOnce();
      for (let attempt = 0; attempt < 3 && "error" in last && last.error.includes("Conflit"); attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 400 + attempt * 300));
        last = await postOnce();
      }
      return last;
    },
    [onUnauthorized],
  );

  /** ± stock : PATCH JSON { stockDelta }. */
  const changeStock = useCallback(
    async (product: AdminProduct, delta: number) => {
      if (product.stock + delta < 0) return;
      setStockError("");
      setBusyProductId(product.id);
      try {
        const response = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stockDelta: delta }),
        });
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        const data = (await response.json().catch(() => ({}))) as {
          product?: AdminProduct;
          error?: string;
        };
        const updated = data.product;
        if (response.ok && updated) {
          setProducts((current) => current.map((item) => (item.id === product.id ? updated : item)));
        } else {
          setStockError(data.error || "Stock non modifié.");
        }
      } catch {
        setStockError("Stock non modifié.");
      } finally {
        setBusyProductId(null);
      }
    },
    [onUnauthorized],
  );

  /** Stock absolu : PATCH JSON { stock }. */
  const setStock = useCallback(
    async (product: AdminProduct, nextStock: number) => {
      if (!Number.isInteger(nextStock) || nextStock < 0 || nextStock > 9999) {
        setStockError("Stock invalide.");
        return;
      }
      if (nextStock === product.stock) return;
      setStockError("");
      setBusyProductId(product.id);
      try {
        const response = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: nextStock }),
        });
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        const data = (await response.json().catch(() => ({}))) as {
          product?: AdminProduct;
          error?: string;
        };
        const updated = data.product;
        if (response.ok && updated) {
          setProducts((current) => current.map((item) => (item.id === product.id ? updated : item)));
        } else {
          setStockError(data.error || "Stock non modifié.");
        }
      } catch {
        setStockError("Stock non modifié.");
      } finally {
        setBusyProductId(null);
      }
    },
    [onUnauthorized],
  );

  const togglePin = useCallback(
    async (product: AdminProduct) => {
      setStockError("");
      setBusyProductId(product.id);
      try {
        const response = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !product.isPinned }),
        });
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        const data = (await response.json().catch(() => ({}))) as {
          product?: AdminProduct;
          error?: string;
        };
        const updated = data.product;
        if (response.ok && updated) {
          setProducts((current) => sortAdminProductsForDisplay(
            current.map((item) => (item.id === product.id ? updated : item)),
          ));
        } else {
          setStockError(data.error || "Épinglage non enregistré.");
        }
      } catch {
        setStockError("Épinglage non enregistré.");
      } finally {
        setBusyProductId(null);
      }
    },
    [onUnauthorized],
  );

  /** Drag & drop : mise à jour locale uniquement (batch via saveProductOrder). */
  const reorderProductsLocal = useCallback((orderedIds: string[]) => {
    setStockError("");
    setGridValidated(false);
    setProducts((current) =>
      sortAdminProductsForDisplay(applyDisplayOrderByIds(current, orderedIds)),
    );
    setOrderDirty(true);
  }, []);

  const discardProductOrder = useCallback(() => {
    setStockError("");
    setProducts(cloneProducts(orderBaselineRef.current));
    setOrderDirty(false);
    setGridValidated(false);
  }, []);

  const saveProductOrder = useCallback(async () => {
    if (!orderDirty || orderSaving) return;
    setStockError("");
    setOrderSaving(true);
    try {
      const result = await publishDropBatchAction(buildDropBatchItems(products));
      if (!result.ok) {
        if (result.error === "Non autorisé.") onUnauthorized();
        setStockError(result.error || "Ordre non enregistré.");
        return;
      }
      const sorted = sortAdminProductsForDisplay(result.products);
      setProducts(sorted);
      syncOrderBaseline(sorted);
      setGridValidated(true);
    } catch {
      setStockError("Ordre non enregistré.");
    } finally {
      setOrderSaving(false);
    }
  }, [onUnauthorized, orderDirty, orderSaving, products, syncOrderBaseline]);

  const publishSelectionLive = useCallback(
    async (productIds: string[]) => {
      if (productIds.length === 0 || publishSaving) return;
      setStockError("");
      setPublishSaving(true);
      try {
        const result = await publishDropBatchAction(buildDropBatchItems(products, productIds));
        if (!result.ok) {
          if (result.error === "Non autorisé.") onUnauthorized();
          setStockError(result.error || "Mise en ligne impossible.");
          return;
        }
        const sorted = sortAdminProductsForDisplay(result.products);
        setProducts(sorted);
        syncOrderBaseline(sorted);
        setGridValidated(false);
        if (result.skipped.length > 0) {
          setStockError(
            `${result.publishedIds.length} publié(s). Non publié : ${result.skipped
              .map((item) => item.id)
              .join(", ")}.`,
          );
        }
      } catch {
        setStockError("Mise en ligne impossible.");
      } finally {
        setPublishSaving(false);
      }
    },
    [onUnauthorized, publishSaving, products, syncOrderBaseline],
  );

  /** @returns un message d'erreur, ou null si supprimé. */
  const remove = useCallback(
    async (product: AdminProduct): Promise<string | null> => {
      setBusyProductId(product.id);
      try {
        const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
        if (response.status === 401) {
          onUnauthorized();
          return "Session expirée.";
        }
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          return data.error ?? "Suppression impossible.";
        }
        setProducts((current) => current.filter((item) => item.id !== product.id));
        return null;
      } catch {
        return "Suppression impossible.";
      } finally {
        setBusyProductId(null);
      }
    },
    [onUnauthorized],
  );

  return {
    products,
    busyProductId,
    stockError,
    orderDirty,
    orderSaving,
    gridValidated,
    publishSaving,
    load,
    reset,
    save,
    changeStock,
    setStock,
    remove,
    togglePin,
    reorderProductsLocal,
    discardProductOrder,
    saveProductOrder,
    publishSelectionLive,
    clearGridValidated,
  };
}
