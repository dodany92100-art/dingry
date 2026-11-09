"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminActionToastState } from "@/components/organisms/admin/admin-action-toast";
import { publishDropBatchAction } from "@/app/actions/admin";
import type { DropBatchItem } from "@/lib/admin/drop-batch";
import {
  buildStockBatchUpdates,
  hasUnsyncedStock,
} from "@/lib/admin/stock-autosave-build";
import {
  STOCK_AUTOSAVE_DEBOUNCE_MS,
  type StockAutosaveStatusMap,
  type StockPendingChanges,
} from "@/lib/admin/stock-autosave-types";
import type { AdminProduct } from "@/lib/admin/types";
import type { CatalogMakerTemplate } from "@/lib/validations/catalog-maker-template";
import {
  applyDisplayOrderByIds,
  sortAdminProductsForDisplay,
} from "@/lib/admin/product-display-order";

function cloneProducts(list: AdminProduct[]): AdminProduct[] {
  return list.map((item) => ({ ...item }));
}

function stockBaselineFromProducts(list: AdminProduct[]): Record<string, number> {
  return Object.fromEntries(list.map((item) => [item.id, item.stock]));
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
  const [makerTemplates, setMakerTemplates] = useState<CatalogMakerTemplate[]>([]);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [stockError, setStockError] = useState("");
  const [orderDirty, setOrderDirty] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [gridValidated, setGridValidated] = useState(false);
  const [publishSaving, setPublishSaving] = useState(false);
  const [stockBaseline, setStockBaseline] = useState<Record<string, number>>({});
  const [stockAutosaveStatus, setStockAutosaveStatus] = useState<StockAutosaveStatusMap>({});
  const [stockToast, setStockToast] = useState<AdminActionToastState>(null);
  const orderBaselineRef = useRef<AdminProduct[]>([]);
  const pendingChangesRef = useRef<StockPendingChanges>({});
  const stockBaselineRef = useRef<Record<string, number>>({});
  const productsRef = useRef<AdminProduct[]>([]);
  const stockDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stockFlushInFlightRef = useRef(false);
  const savedHintTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
      const data = (await response.json()) as {
        products: AdminProduct[];
        makerTemplates?: CatalogMakerTemplate[];
      };
      setProducts(data.products);
      setMakerTemplates(Array.isArray(data.makerTemplates) ? data.makerTemplates : []);
      syncOrderBaseline(data.products);
      setStockBaseline(stockBaselineFromProducts(data.products));
      return "ok";
    } catch {
      return "error";
    }
  }, [syncOrderBaseline]);

  const reset = useCallback(() => {
    setProducts([]);
    setMakerTemplates([]);
    setStockError("");
    orderBaselineRef.current = [];
    setOrderDirty(false);
    setOrderSaving(false);
    setGridValidated(false);
    setPublishSaving(false);
    setStockBaseline({});
    pendingChangesRef.current = {};
    stockBaselineRef.current = {};
    productsRef.current = [];
    setStockAutosaveStatus({});
    setStockToast(null);
    if (stockDebounceRef.current) {
      clearTimeout(stockDebounceRef.current);
      stockDebounceRef.current = null;
    }
    for (const timer of Object.values(savedHintTimersRef.current)) clearTimeout(timer);
    savedHintTimersRef.current = {};
  }, []);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    stockBaselineRef.current = stockBaseline;
  }, [stockBaseline]);

  const dismissStockToast = useCallback(() => setStockToast(null), []);

  const syncPendingDelta = useCallback((productId: string, nextStock: number) => {
    const base = stockBaselineRef.current[productId];
    if (base === undefined) return;
    const delta = nextStock - base;
    if (delta === 0) {
      delete pendingChangesRef.current[productId];
    } else {
      pendingChangesRef.current[productId] = delta;
    }
  }, []);

  const setSavingPhase = useCallback((ids: string[]) => {
    setStockAutosaveStatus((current) => {
      const next = { ...current };
      for (const id of ids) next[id] = "saving";
      return next;
    });
  }, []);

  const setSavedPhase = useCallback((ids: string[]) => {
    setStockAutosaveStatus((current) => {
      const next = { ...current };
      for (const id of ids) next[id] = "saved";
      return next;
    });
    for (const id of ids) {
      const existing = savedHintTimersRef.current[id];
      if (existing) clearTimeout(existing);
      savedHintTimersRef.current[id] = setTimeout(() => {
        setStockAutosaveStatus((current) => {
          if (current[id] !== "saved") return current;
          const next = { ...current };
          delete next[id];
          return next;
        });
        delete savedHintTimersRef.current[id];
      }, 2400);
    }
  }, []);

  const reconcilePendingAfterSave = useCallback((saved: AdminProduct[]) => {
    for (const item of saved) {
      const live = productsRef.current.find((row) => row.id === item.id);
      const displayStock = live?.stock ?? item.stock;
      syncPendingDelta(item.id, displayStock);
    }
  }, [syncPendingDelta]);

  const flushStockAutosave = useCallback(
    async (options?: { keepalive?: boolean }) => {
      if (stockFlushInFlightRef.current) return;
      if (stockDebounceRef.current) {
        clearTimeout(stockDebounceRef.current);
        stockDebounceRef.current = null;
      }

      const updates = buildStockBatchUpdates(pendingChangesRef.current, stockBaselineRef.current);
      if (updates.length === 0) return;

      stockFlushInFlightRef.current = true;
      const ids = updates.map((row) => row.id);
      setSavingPhase(ids);
      setStockError("");

      try {
        const response = await fetch("/api/admin/products/stock-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
          ...(options?.keepalive ? { keepalive: true } : {}),
        });
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        const data = (await response.json().catch(() => ({}))) as {
          products?: AdminProduct[];
          error?: string;
          failed?: string[];
        };
        if (!response.ok) {
          const message = data.error || "Stock non enregistré.";
          setStockError(message);
          setStockToast({ message, variant: "error" });
          setStockAutosaveStatus((current) => {
            const next = { ...current };
            for (const id of ids) delete next[id];
            return next;
          });
          return;
        }

        const saved = data.products ?? [];
        if (saved.length > 0) {
          setProducts((current) => {
            const byId = new Map(saved.map((item) => [item.id, item]));
            return current.map((item) => byId.get(item.id) ?? item);
          });
          setStockBaseline((current) => {
            const next = { ...current };
            for (const item of saved) next[item.id] = item.stock;
            stockBaselineRef.current = next;
            return next;
          });
          reconcilePendingAfterSave(saved);
        }

        const savedIds = saved.map((item) => item.id);
        if (savedIds.length > 0) setSavedPhase(savedIds);

        const failed = data.failed ?? [];
        if (failed.length > 0) {
          setStockToast({
            message: `Échec partiel : ${failed.join(", ")}.`,
            variant: "error",
          });
          setStockError(`Échec partiel : ${failed.join(", ")}.`);
        }

        if (hasUnsyncedStock(pendingChangesRef.current, stockBaselineRef.current)) {
          stockDebounceRef.current = setTimeout(() => {
            stockDebounceRef.current = null;
            void flushStockAutosave();
          }, STOCK_AUTOSAVE_DEBOUNCE_MS);
        }
      } catch {
        if (!options?.keepalive) {
          const message = "Stock non enregistré.";
          setStockError(message);
          setStockToast({ message, variant: "error" });
        }
        setStockAutosaveStatus((current) => {
          const next = { ...current };
          for (const id of ids) delete next[id];
          return next;
        });
      } finally {
        stockFlushInFlightRef.current = false;
      }
    },
    [onUnauthorized, reconcilePendingAfterSave, setSavedPhase, setSavingPhase],
  );

  const emergencyFlushStock = useCallback(() => {
    if (stockDebounceRef.current) {
      clearTimeout(stockDebounceRef.current);
      stockDebounceRef.current = null;
    }
    const updates = buildStockBatchUpdates(pendingChangesRef.current, stockBaselineRef.current);
    if (updates.length === 0) return;
    const body = JSON.stringify({ updates });
    const sent = navigator.sendBeacon(
      "/api/admin/products/stock-batch",
      new Blob([body], { type: "application/json" }),
    );
    if (!sent) {
      void fetch("/api/admin/products/stock-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  }, []);

  const scheduleStockAutosave = useCallback(() => {
    if (stockDebounceRef.current) clearTimeout(stockDebounceRef.current);
    stockDebounceRef.current = setTimeout(() => {
      stockDebounceRef.current = null;
      void flushStockAutosave();
    }, STOCK_AUTOSAVE_DEBOUNCE_MS);
  }, [flushStockAutosave]);

  useEffect(() => {
    const flushIfPending = () => {
      if (
        stockDebounceRef.current ||
        hasUnsyncedStock(pendingChangesRef.current, stockBaselineRef.current)
      ) {
        emergencyFlushStock();
      }
    };
    window.addEventListener("pagehide", flushIfPending);
    window.addEventListener("beforeunload", flushIfPending);
    return () => {
      window.removeEventListener("pagehide", flushIfPending);
      window.removeEventListener("beforeunload", flushIfPending);
      if (stockDebounceRef.current) clearTimeout(stockDebounceRef.current);
      for (const timer of Object.values(savedHintTimersRef.current)) clearTimeout(timer);
    };
  }, [emergencyFlushStock]);

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
            if (response.status === 404) {
              return {
                error:
                  data.error === "Produit introuvable."
                    ? "Produit introuvable sur le serveur. Recharge l’admin (onglet Produits) ou rouvre la fiche depuis la grille."
                    : data.error || "Impossible d'enregistrer le produit.",
              };
            }
            return { error: data.error || "Impossible d'enregistrer le produit." };
          }
          setProducts((current) =>
            editingId
              ? current.map((item) => (item.id === editingId ? saved : item))
              : [saved, ...current],
          );
          setStockBaseline((current) => ({ ...current, [saved.id]: saved.stock }));
          return { product: saved };
        } catch {
          return { error: "Impossible d'enregistrer le produit." };
        }
      }

      let last = await postOnce();
      if ("error" in last && last.error.includes("Conflit")) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        last = await postOnce();
      }
      if ("error" in last && last.error.includes("Conflit")) {
        return {
          error:
            "Conflit d'enregistrement. Ferme les autres onglets admin (prod/preview), attends 3 s et réessaie.",
        };
      }
      return last;
    },
    [onUnauthorized],
  );

  /** ± stock : local + `pendingChanges` (delta vs baseline) · autosave 6 s. */
  const changeStock = useCallback(
    (product: AdminProduct, delta: number) => {
      if (product.stock + delta < 0) return;
      setStockError("");
      const nextStock = product.stock + delta;
      syncPendingDelta(product.id, nextStock);
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, stock: nextStock } : item)),
      );
      scheduleStockAutosave();
    },
    [scheduleStockAutosave, syncPendingDelta],
  );

  /** Stock absolu : idem autosave debouncé. */
  const setStock = useCallback(
    (product: AdminProduct, nextStock: number) => {
      if (!Number.isInteger(nextStock) || nextStock < 0 || nextStock > 9999) {
        setStockError("Stock invalide.");
        return;
      }
      if (nextStock === product.stock) return;
      setStockError("");
      syncPendingDelta(product.id, nextStock);
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, stock: nextStock } : item)),
      );
      scheduleStockAutosave();
    },
    [scheduleStockAutosave, syncPendingDelta],
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
    makerTemplates,
    refreshMakerTemplates: async () => {
      const response = await fetch("/api/admin/catalog-maker-templates", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { makerTemplates?: CatalogMakerTemplate[] };
      if (Array.isArray(data.makerTemplates)) setMakerTemplates(data.makerTemplates);
    },
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
    stockAutosaveStatus,
    stockToast,
    dismissStockToast,
    remove,
    togglePin,
    reorderProductsLocal,
    discardProductOrder,
    saveProductOrder,
    publishSelectionLive,
    clearGridValidated,
  };
}
