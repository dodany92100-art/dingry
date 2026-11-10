"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShopCatalogPersoBanner } from "@/lib/admin/types";
import { DEFAULT_CATALOG_PERSO_BANNER } from "@/lib/catalog-perso-banner";

export type PersoBannerState = "loading" | "ready" | "error";

type UseShopPersoBannerOptions = {
  /** Quand false, pas de requête CRM (défaut true). */
  enabled?: boolean;
};

export function useShopPersoBanner(options?: UseShopPersoBannerOptions) {
  const enabled = options?.enabled ?? true;
  const [banner, setBanner] = useState<ShopCatalogPersoBanner>(DEFAULT_CATALOG_PERSO_BANNER);
  const [state, setState] = useState<PersoBannerState>(enabled ? "loading" : "ready");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/catalog-perso-banner");
      if (!response.ok) {
        setBanner({ ...DEFAULT_CATALOG_PERSO_BANNER, enabled: false });
        setState("error");
        return;
      }
      const data = (await response.json()) as { banner?: ShopCatalogPersoBanner };
      if (data.banner?.imageUrl?.trim()) {
        setBanner(data.banner);
        setState("ready");
      } else {
        setBanner({ ...DEFAULT_CATALOG_PERSO_BANNER, enabled: false });
        setState("error");
      }
    } catch {
      setBanner({ ...DEFAULT_CATALOG_PERSO_BANNER, enabled: false });
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return { banner, state, retry: load };
}
