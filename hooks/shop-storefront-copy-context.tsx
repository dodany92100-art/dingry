"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { parseCatalogFilter, type CatalogCategory, type CatalogFilter } from "@/lib/catalog-category";
import {
  DEFAULT_SHOP_STOREFRONT_COPY,
  normalizeShopStorefrontCopy,
  type ShopStorefrontCopyConfig,
} from "@/lib/shop-storefront-copy";

let cachedCopy: ShopStorefrontCopyConfig | null = null;
let inflight: Promise<ShopStorefrontCopyConfig> | null = null;

export function invalidateShopStorefrontCopyCache(): void {
  cachedCopy = null;
}

async function fetchShopStorefrontCopy(): Promise<ShopStorefrontCopyConfig> {
  if (cachedCopy) return cachedCopy;
  if (inflight) return inflight;
  inflight = fetch("/api/shop/storefront-copy", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return normalizeShopStorefrontCopy(null);
      const payload = (await response.json()) as { copy?: ShopStorefrontCopyConfig };
      const next = normalizeShopStorefrontCopy(payload.copy ?? null);
      cachedCopy = next;
      return next;
    })
    .catch(() => normalizeShopStorefrontCopy(null))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

type ShopStorefrontCopyContextValue = {
  copy: ShopStorefrontCopyConfig;
  loaded: boolean;
  adminAdjust: boolean;
  catalogTabLabel: (tab: string, i18nLabel: (tab: string) => string) => string;
  categorySectionLabel: (category: CatalogCategory, i18nLabel: string) => string;
  saveCopy: (patch: Partial<ShopStorefrontCopyConfig>) => Promise<boolean>;
  saving: boolean;
};

const ShopStorefrontCopyContext = createContext<ShopStorefrontCopyContextValue | null>(null);

type ProviderProps = {
  children: ReactNode;
  adminAdjust?: boolean;
};

export function ShopStorefrontCopyProvider({ children, adminAdjust = false }: ProviderProps) {
  const [copy, setCopy] = useState<ShopStorefrontCopyConfig>(
    cachedCopy ?? DEFAULT_SHOP_STOREFRONT_COPY,
  );
  const [loaded, setLoaded] = useState(cachedCopy !== null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchShopStorefrontCopy().then((next) => {
      if (!cancelled) {
        setCopy(next);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogTabLabel = useCallback(
    (tab: string, i18nLabel: (tab: string) => string): string => {
      const filter = parseCatalogFilter(tab);
      const override = copy.catalog[filter]?.trim();
      if (override) return override;
      return i18nLabel(tab);
    },
    [copy.catalog],
  );

  const categorySectionLabel = useCallback(
    (category: CatalogCategory, i18nLabel: string): string => {
      const override = copy.catalog[category]?.trim();
      if (override) return override;
      return i18nLabel;
    },
    [copy.catalog],
  );

  const saveCopy = useCallback(
    async (patch: Partial<ShopStorefrontCopyConfig>): Promise<boolean> => {
      if (!adminAdjust || saving) return false;
      setSaving(true);
      try {
        const response = await fetch("/api/admin/shop/storefront-copy", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(patch),
        });
        if (!response.ok) return false;
        const payload = (await response.json()) as { copy?: ShopStorefrontCopyConfig };
        if (!payload.copy) return false;
        const next = normalizeShopStorefrontCopy(payload.copy);
        cachedCopy = next;
        setCopy(next);
        return true;
      } catch {
        return false;
      } finally {
        setSaving(false);
      }
    },
    [adminAdjust, saving],
  );

  const value = useMemo<ShopStorefrontCopyContextValue>(
    () => ({
      copy,
      loaded,
      adminAdjust,
      catalogTabLabel,
      categorySectionLabel,
      saveCopy,
      saving,
    }),
    [adminAdjust, catalogTabLabel, categorySectionLabel, copy, loaded, saveCopy, saving],
  );

  return <ShopStorefrontCopyContext.Provider value={value}>{children}</ShopStorefrontCopyContext.Provider>;
}

export function useShopStorefrontCopy(): ShopStorefrontCopyContextValue {
  const ctx = useContext(ShopStorefrontCopyContext);
  if (!ctx) {
    return {
      copy: cachedCopy ?? DEFAULT_SHOP_STOREFRONT_COPY,
      loaded: cachedCopy !== null,
      adminAdjust: false,
      catalogTabLabel: (_tab, i18nLabel) => i18nLabel(_tab),
      categorySectionLabel: (_category, i18nLabel) => i18nLabel,
      saveCopy: async () => false,
      saving: false,
    };
  }
  return ctx;
}