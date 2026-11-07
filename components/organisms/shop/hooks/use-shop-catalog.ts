"use client";

import { useCallback, useEffect, useState } from "react";
import { overlayShopCatalog, shopProductFromUnknown, type ShopProduct } from "@/lib/catalog";
import { PRODUCTS } from "@/lib/shop-data";

export type CatalogState = "loading" | "ready" | "error";

export function useShopCatalog() {
  const [products, setProducts] = useState<ShopProduct[]>(PRODUCTS);
  const [catalogState, setCatalogState] = useState<CatalogState>("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      setCatalogState((state) => (state === "ready" ? state : "loading"));
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setProducts(PRODUCTS);
            setCatalogState("ready");
          }
          return;
        }
        const data = (await response.json()) as {
          products?: unknown;
          removedCatalogIds?: unknown;
        };
        const live = Array.isArray(data.products)
          ? data.products
              .map(shopProductFromUnknown)
              .filter((item): item is NonNullable<typeof item> => item !== null)
          : [];
        const removedCatalogIds = Array.isArray(data.removedCatalogIds)
          ? data.removedCatalogIds.filter(
              (id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0,
            )
          : [];
        if (!cancelled) {
          if (live.length > 0 || removedCatalogIds.length > 0) {
            setProducts(overlayShopCatalog(PRODUCTS, live, removedCatalogIds));
          }
          setCatalogState("ready");
        }
      } catch {
        if (!cancelled) {
          setProducts(PRODUCTS);
          setCatalogState("ready");
        }
      }
    }
    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const retry = useCallback(() => setRetryCount((value) => value + 1), []);

  return { products, catalogState, retry };
}
