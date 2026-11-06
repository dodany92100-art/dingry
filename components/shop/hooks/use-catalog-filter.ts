"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseCatalogFilter, type CatalogFilter } from "@/lib/shop-catalog";

/** Filtre catalogue piloté par ?category= ; fait défiler vers le catalogue à chaque changement. */
export function useCatalogFilter(scrollToSection: (id: string) => void) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = parseCatalogFilter(searchParams.get("category"));

  const selectFilter = useCallback(
    (next: CatalogFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("category");
      else params.set("category", next);
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    },
    [router, searchParams],
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
