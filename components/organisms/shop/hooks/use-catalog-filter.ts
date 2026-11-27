"use client";

import { startTransition, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  catalogBrandFilterQueryValue,
  parseCatalogBrandFilter,
  type CatalogBrandFilter,
} from "@/lib/catalog-brand";
import {
  CATALOG_FILTER_ALL_BRANDS,
  catalogScrollIdForFilter,
  parseCatalogFilter,
  type CatalogFilter,
} from "@/lib/shop-catalog";
import { shopBasePathFromPathname } from "@/lib/shop-base-path";

function liveSearchParams(fallback: string): URLSearchParams {
  const live = typeof window !== "undefined" ? window.location.search.slice(1) : fallback;
  return new URLSearchParams(live);
}

/** Filtres catalogue pilotés par `?category=` et `?brand=` ; scroll vers le catalogue à chaque changement de catégorie. */
export function useCatalogFilter(scrollToSection: (id: string) => void) {
  const router = useRouter();
  const pathname = usePathname();
  const shopBasePath = shopBasePathFromPathname(pathname ?? "/");
  const searchParams = useSearchParams();
  const activeFilter = parseCatalogFilter(searchParams.get("category"));
  const activeBrand = parseCatalogBrandFilter(searchParams.get("brand"));

  const replaceQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = liveSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      const href = query ? `${shopBasePath}?${query}` : shopBasePath;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [router, searchParams, shopBasePath],
  );

  const selectFilter = useCallback(
    (next: CatalogFilter) => {
      replaceQuery((params) => {
        if (next === CATALOG_FILTER_ALL_BRANDS) params.set("category", CATALOG_FILTER_ALL_BRANDS);
        else if (next === "all") params.delete("category");
        else params.set("category", next);
      });
    },
    [replaceQuery],
  );

  const selectBrand = useCallback(
    (next: CatalogBrandFilter) => {
      replaceQuery((params) => {
        const value = catalogBrandFilterQueryValue(next);
        if (!value) params.delete("brand");
        else params.set("brand", value);
      });
    },
    [replaceQuery],
  );

  const skipFirstScroll = useRef(true);
  useEffect(() => {
    const targetId = catalogScrollIdForFilter(activeFilter);
    if (skipFirstScroll.current) {
      skipFirstScroll.current = false;
      if (activeFilter !== "all" && activeFilter !== CATALOG_FILTER_ALL_BRANDS) scrollToSection(targetId);
      return;
    }
    scrollToSection(targetId);
  }, [activeFilter, scrollToSection]);

  return { activeFilter, activeBrand, selectFilter, selectBrand };
}