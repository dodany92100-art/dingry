"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShopCatalogPersoBanner } from "@/lib/admin/types";
import { DEFAULT_CATALOG_PERSO_BANNER } from "@/lib/catalog-perso-banner";

export type PersoBannerState = "loading" | "ready" | "error";

export function useShopPersoBanner() {
  const [banner, setBanner] = useState<ShopCatalogPersoBanner>(DEFAULT_CATALOG_PERSO_BANNER);
  const [state, setState] = useState<PersoBannerState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/catalog-perso-banner");
      if (!response.ok) {
        setBanner(DEFAULT_CATALOG_PERSO_BANNER);
        setState("error");
        return;
      }
      const data = (await response.json()) as { banner?: ShopCatalogPersoBanner };
      if (data.banner) {
        setBanner(data.banner);
        setState("ready");
      } else {
        setBanner(DEFAULT_CATALOG_PERSO_BANNER);
        setState("error");
      }
    } catch {
      setBanner(DEFAULT_CATALOG_PERSO_BANNER);
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { banner, state, retry: load };
}
