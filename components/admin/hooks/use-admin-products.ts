"use client";

import { useCallback, useState } from "react";
import type { AdminProduct } from "@/lib/admin/types";

export type LoadResult = "ok" | "unauthorized" | "error";
export type SaveProductResult = { product: AdminProduct } | { error: string };

type Options = { onUnauthorized: () => void };

export function useAdminProducts({ onUnauthorized }: Options) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [stockError, setStockError] = useState("");

  const load = useCallback(async (): Promise<LoadResult> => {
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      if (response.status === 401) return "unauthorized";
      if (!response.ok) return "error";
      const data = (await response.json()) as { products: AdminProduct[] };
      setProducts(data.products);
      return "ok";
    } catch {
      return "error";
    }
  }, []);

  const reset = useCallback(() => {
    setProducts([]);
    setStockError("");
  }, []);

  /** Création (POST multipart) ou modification (PATCH multipart). Le stock n'est jamais envoyé en modification. */
  const save = useCallback(
    async (editingId: string | null, formData: FormData): Promise<SaveProductResult> => {
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
    },
    [onUnauthorized],
  );

  /** ± stock : PATCH JSON { stockDelta }, jamais mélangé au multipart. */
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

  return { products, busyProductId, stockError, load, reset, save, changeStock, remove };
}
