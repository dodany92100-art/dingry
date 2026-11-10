"use client";

import { useCallback, useEffect, useState } from "react";
import {
  resolveShopAtelierCustomConfig,
  SHOP_ATELIER_CUSTOM_DEFAULT,
  type ShopAtelierCustomConfig,
} from "@/lib/atelier-custom-config";

export type AtelierCustomState = "loading" | "ready" | "error";

type Options = { enabled?: boolean };

export function useShopAtelierCustom(options?: Options) {
  const enabled = options?.enabled ?? true;
  const [config, setConfig] = useState<ShopAtelierCustomConfig>(() =>
    resolveShopAtelierCustomConfig(SHOP_ATELIER_CUSTOM_DEFAULT),
  );
  const [state, setState] = useState<AtelierCustomState>(enabled ? "loading" : "ready");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/atelier-custom");
      if (!response.ok) {
        setConfig(resolveShopAtelierCustomConfig(SHOP_ATELIER_CUSTOM_DEFAULT));
        setState("error");
        return;
      }
      const data = (await response.json()) as ShopAtelierCustomConfig;
      setConfig(resolveShopAtelierCustomConfig(data));
      setState("ready");
    } catch {
      setConfig(resolveShopAtelierCustomConfig(SHOP_ATELIER_CUSTOM_DEFAULT));
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return { config, state, retry: load };
}
