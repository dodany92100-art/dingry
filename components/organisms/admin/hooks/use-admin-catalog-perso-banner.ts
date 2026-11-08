"use client";

import { useCallback, useState } from "react";
import type { AdminCatalogPersoBanner } from "@/lib/admin/types";
import { resolveAdminCatalogPersoBanner } from "@/lib/catalog-perso-banner";

export type LoadResult = "ok" | "unauthorized" | "error";
export type SavePersoBannerResult = { banner: AdminCatalogPersoBanner } | { error: string };

type Options = { onUnauthorized: () => void };

const CONFLICT_HINT =
  "Conflit d'enregistrement. Ferme les autres onglets admin (prod/preview), attends 3 s et réessaie.";

function isConflictMessage(message: string | undefined): boolean {
  return Boolean(message?.includes("Conflit"));
}

export function useAdminCatalogPersoBanner({ onUnauthorized }: Options) {
  const [banner, setBanner] = useState<AdminCatalogPersoBanner>(() =>
    resolveAdminCatalogPersoBanner(undefined),
  );
  const [customized, setCustomized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<LoadResult> => {
    try {
      const response = await fetch("/api/admin/catalog-perso-banner", { cache: "no-store" });
      if (response.status === 401) return "unauthorized";
      if (!response.ok) return "error";
      const data = (await response.json()) as {
        banner: AdminCatalogPersoBanner;
        customized?: boolean;
      };
      setBanner(data.banner);
      setCustomized(Boolean(data.customized));
      return "ok";
    } catch {
      return "error";
    }
  }, []);

  const reset = useCallback(() => {
    setBanner(resolveAdminCatalogPersoBanner(undefined));
    setCustomized(false);
    setError("");
  }, []);

  const save = useCallback(
    async (formData: FormData): Promise<SavePersoBannerResult> => {
      setSaving(true);
      setError("");
      try {
        const response = await fetch("/api/admin/catalog-perso-banner", { method: "PATCH", body: formData });
        if (response.status === 401) {
          onUnauthorized();
          return { error: "Session expirée." };
        }
        const data = (await response.json().catch(() => ({}))) as {
          banner?: AdminCatalogPersoBanner;
          error?: string;
        };
        if (!response.ok || !data.banner) {
          const err = data.error || "Impossible d'enregistrer la bannière.";
          return { error: isConflictMessage(err) ? CONFLICT_HINT : err };
        }
        setBanner(data.banner);
        setCustomized(true);
        return { banner: data.banner };
      } catch {
        return { error: "Impossible d'enregistrer la bannière." };
      } finally {
        setSaving(false);
      }
    },
    [onUnauthorized],
  );

  return {
    banner,
    customized,
    saving,
    error,
    setError,
    load,
    reset,
    save,
  };
}
