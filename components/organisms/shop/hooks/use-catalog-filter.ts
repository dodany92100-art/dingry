"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseCatalogFilter, type CatalogFilter } from "@/lib/shop-catalog";
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
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("category");
      else params.set("category", next);
      const query = params.toString();
      const href = query ? `${shopBasePath}?${query}` : shopBasePath;
      router.replace(href, { scroll: false });
    },
    [router, searchParams, shopBasePath],
  );

  const skipFirstScroll = useRef(true);
  useEffect(() => {
    if (skipFirstScroll.current) {
      skipFirstScroll.current = false;
      return;
    }
    scrollToSection("catalogue-landing");
  }, [activeFilter, scrollToSection]);

  return { activeFilter, selectFilter };
}
