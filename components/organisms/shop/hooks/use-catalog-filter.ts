"use client";

import { startTransition, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { catalogScrollIdForFilter, parseCatalogFilter, type CatalogFilter } from "@/lib/shop-catalog";
import { shopBasePathFromPathname } from "@/lib/shop-base-path";

/** Filtre catalogue piloté par ?category= ; fait défiler vers le catalogue à chaque changement. */
export function useCatalogFilter(scrollToSection: (id: string) => void) {
  const router = useRouter();
  const pathname = usePathname();
  const shopBasePath = shopBasePathFromPathname(pathname ?? "/");
  const searchParams = useSearchParams();
  const activeFilter = parseCatalogFilter(searchParams.get("category"));

  const selectFilter = useCallback(
    (next: CatalogFilter) => {
      const live =
        typeof window !== "undefined" ? window.location.search.slice(1) : searchParams.toString();
      const params = new URLSearchParams(live);
      if (next === "all") params.delete("category");
      else params.set("category", next);
      const query = params.toString();
      const href = query ? `${shopBasePath}?${query}` : shopBasePath;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [router, searchParams, shopBasePath],
  );

  const skipFirstScroll = useRef(true);
  useEffect(() => {
    const targetId = catalogScrollIdForFilter(activeFilter);
    if (skipFirstScroll.current) {
      skipFirstScroll.current = false;
      if (activeFilter !== "all") scrollToSection(targetId);
      return;
    }
    scrollToSection(targetId);
  }, [activeFilter, scrollToSection]);

  return { activeFilter, selectFilter };
}
