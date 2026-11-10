"use client";

import { useCallback, useState } from "react";
import type { AdminActionToastState } from "@/components/organisms/admin/admin-action-toast";
import {
  resolveShopAtelierCustomConfig,
  SHOP_ATELIER_CUSTOM_DEFAULT,
  type AdminAtelierCustomConfig,
} from "@/lib/atelier-custom-config";

export type LoadResult = "ok" | "unauthorized" | "error";
export type SaveAtelierCustomResult = { config: AdminAtelierCustomConfig } | { error: string };

type Options = { onUnauthorized: () => void };

export function useAdminAtelierCustom({ onUnauthorized }: Options) {
  const [config, setConfig] = useState<AdminAtelierCustomConfig>(() => ({
    ...resolveShopAtelierCustomConfig(SHOP_ATELIER_CUSTOM_DEFAULT),
    updatedAt: "",
  }));
  const [customized, setCustomized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<AdminActionToastState>(null);

  const load = useCallback(async (): Promise<LoadResult> => {
    try {
      const response = await fetch("/api/admin/atelier-custom", { cache: "no-store" });
      if (response.status === 401) return "unauthorized";
      if (!response.ok) return "error";
      const data = (await response.json()) as { config: AdminAtelierCustomConfig; customized?: boolean };
      setConfig(data.config);
      setCustomized(Boolean(data.customized));
      return "ok";
    } catch {
      return "error";
    }
  }, []);

  const reset = useCallback(() => {
    setConfig({ ...resolveShopAtelierCustomConfig(SHOP_ATELIER_CUSTOM_DEFAULT), updatedAt: "" });
    setCustomized(false);
    setError("");
  }, []);

  const save = useCallback(
    async (next: AdminAtelierCustomConfig): Promise<SaveAtelierCustomResult> => {
      setSaving(true);
      setError("");
      try {
        const response = await fetch("/api/admin/atelier-custom", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (response.status === 401) {
          onUnauthorized();
          return { error: "Session expirée." };
        }
        const data = (await response.json().catch(() => ({}))) as {
          config?: AdminAtelierCustomConfig;
          error?: string;
        };
        if (!response.ok || !data.config) {
          const err = data.error || "Impossible d'enregistrer l'atelier CUSTOM.";
          return { error: err };
        }
        setConfig(data.config);
        setCustomized(true);
        setToast({
          variant: "success",
          message: data.config.enabled
            ? "Atelier CUSTOM en ligne — vitrine à jour."
            : "Atelier enregistré (désactivé boutique).",
        });
        return { config: data.config };
      } catch {
        return { error: "Impossible d'enregistrer l'atelier CUSTOM." };
      } finally {
        setSaving(false);
      }
    },
    [onUnauthorized],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  return { config, customized, saving, error, setError, toast, dismissToast, load, reset, save };
}
