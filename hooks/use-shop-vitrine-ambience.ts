"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SHOP_VITRINE_AMBIENCE,
  type ShopVitrineAmbienceConfig,
  vitrineAmbienceObjectPosition,
} from "@/lib/shop-vitrine-ambience";

let cachedAmbience: ShopVitrineAmbienceConfig | null = null;
let inflight: Promise<ShopVitrineAmbienceConfig> | null = null;

async function fetchShopVitrineAmbience(): Promise<ShopVitrineAmbienceConfig> {
  if (cachedAmbience) return cachedAmbience;
  if (inflight) return inflight;
  inflight = fetch("/api/shop/vitrine-ambience", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return { ...DEFAULT_SHOP_VITRINE_AMBIENCE };
      const payload = (await response.json()) as { ambience?: ShopVitrineAmbienceConfig };
      const next = payload.ambience ?? DEFAULT_SHOP_VITRINE_AMBIENCE;
      cachedAmbience = next;
      return next;
    })
    .catch(() => ({ ...DEFAULT_SHOP_VITRINE_AMBIENCE }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useShopVitrineAmbience(): {
  ambience: ShopVitrineAmbienceConfig;
  objectPosition: string;
} {
  const [ambience, setAmbience] = useState<ShopVitrineAmbienceConfig>(
    cachedAmbience ?? DEFAULT_SHOP_VITRINE_AMBIENCE,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchShopVitrineAmbience().then((next) => {
      if (!cancelled) setAmbience(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ambience,
    objectPosition: vitrineAmbienceObjectPosition(ambience),
  };
}