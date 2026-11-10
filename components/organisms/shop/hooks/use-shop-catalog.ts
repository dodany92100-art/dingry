"use client";

import { useCallback, useEffect, useState } from "react";
import { overlayShopCatalog, shopProductFromUnknown, type ShopProduct } from "@/lib/catalog";
import { PRODUCTS } from "@/lib/shop-data";

export type CatalogState = "loading" | "ready" | "error";

type CatalogApiPayload = {
  products?: unknown;
  removedCatalogIds?: unknown;
  crmOnly?: boolean;
  error?: string;
};

function parseRemovedCatalogIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0,
  );
}

function parseLiveProducts(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map(shopProductFromUnknown)
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export function useShopCatalog() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [catalogState, setCatalogState] = useState<CatalogState>("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      setCatalogState((state) => (state === "ready" ? state : "loading"));
      try {
        const response = await fetch("/api/catalog");
        let data: CatalogApiPayload = {};
        try {
          data = (await response.json()) as CatalogApiPayload;
        } catch {
          data = {};
        }
        const crmOnly = data.crmOnly === true;

        if (!response.ok) {
          if (!cancelled) {
            if (crmOnly) {
              setProducts([]);
              setCatalogState("error");
            } else {
              setProducts(PRODUCTS);
              setCatalogState("ready");
            }
          }
          return;
        }

        const live = parseLiveProducts(data.products);
        const removedCatalogIds = parseRemovedCatalogIds(data.removedCatalogIds);
        if (!cancelled) {
          setProducts(
            overlayShopCatalog(PRODUCTS, live, removedCatalogIds, { crmOnly }),
          );
          setCatalogState("ready");
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setCatalogState("error");
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
