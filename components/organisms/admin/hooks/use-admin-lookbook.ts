"use client";

import { useCallback, useState } from "react";
import type { AdminLookbookSlide, AdminLookbookSlideView } from "@/lib/admin/types";

export type LoadResult = "ok" | "unauthorized" | "error";
export type SaveLookbookResult = { slide: AdminLookbookSlide } | { error: string };
export type { AdminLookbookSlideView };

type Options = { onUnauthorized: () => void };

const CONFLICT_HINT =
  "Conflit d'enregistrement. Ferme les autres onglets admin (prod/preview), attends 3 s et réessaie.";

function isConflictMessage(message: string | undefined): boolean {
  return Boolean(message?.includes("Conflit"));
}

export function useAdminLookbook({ onUnauthorized }: Options) {
  const [slides, setSlides] = useState<AdminLookbookSlideView[]>([]);
  const [busySlideId, setBusySlideId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<LoadResult> => {
    try {
      const response = await fetch("/api/admin/lookbook", { cache: "no-store" });
      if (response.status === 401) return "unauthorized";
      if (!response.ok) return "error";
      const data = (await response.json()) as { slides: AdminLookbookSlideView[] };
      setSlides(data.slides);
      return "ok";
    } catch {
      return "error";
    }
  }, []);

  const reset = useCallback(() => {
    setSlides([]);
    setError("");
  }, []);

  const save = useCallback(
    async (editingId: string | null, formData: FormData): Promise<SaveLookbookResult> => {
      try {
        const response = await fetch(
          editingId ? `/api/admin/lookbook/${editingId}` : "/api/admin/lookbook",
          { method: editingId ? "PATCH" : "POST", body: formData },
        );
        if (response.status === 401) {
          onUnauthorized();
          return { error: "Session expirée." };
        }
        const data = (await response.json().catch(() => ({}))) as {
          slide?: AdminLookbookSlide;
          error?: string;
        };
        const saved = data.slide;
        if (!response.ok || !saved) {
          const err = data.error || "Impossible d'enregistrer la slide.";
          return { error: isConflictMessage(err) ? CONFLICT_HINT : err };
        }
        const savedView: AdminLookbookSlideView = { ...saved, source: "stored" };
        setSlides((current) => {
          const next = editingId
            ? current.map((item) => (item.id === editingId ? savedView : item))
            : [...current, savedView];
          return [...next].sort((a, b) => a.sortOrder - b.sortOrder);
        });
        return { slide: saved };
      } catch {
        return { error: "Impossible d'enregistrer la slide." };
      }
    },
    [onUnauthorized],
  );

  const remove = useCallback(
    async (slide: AdminLookbookSlideView): Promise<string | null> => {
      setError("");
      setBusySlideId(slide.id);

      async function deleteOnce(): Promise<string | null> {
        try {
          const response = await fetch(`/api/admin/lookbook/${slide.id}`, { method: "DELETE" });
          if (response.status === 401) {
            onUnauthorized();
            return "Session expirée.";
          }
          if (!response.ok) {
            const data = (await response.json().catch(() => ({}))) as { error?: string };
            return data.error || "Impossible de supprimer la slide.";
          }
          setSlides((current) => current.filter((item) => item.id !== slide.id));
          return null;
        } catch {
          return "Impossible de supprimer la slide.";
        }
      }

      try {
        let err = await deleteOnce();
        if (err && isConflictMessage(err)) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          err = await deleteOnce();
        }
        if (err && isConflictMessage(err)) return CONFLICT_HINT;
        return err;
      } finally {
        setBusySlideId(null);
      }
    },
    [onUnauthorized],
  );

  const reorder = useCallback(
    async (slide: AdminLookbookSlideView, direction: "up" | "down"): Promise<string | null> => {
      setError("");
      setBusySlideId(slide.id);
      try {
        const response = await fetch(`/api/admin/lookbook/${slide.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reorder: direction }),
        });
        if (response.status === 401) {
          onUnauthorized();
          return "Session expirée.";
        }
        const data = (await response.json().catch(() => ({}))) as {
          slides?: AdminLookbookSlide[];
          error?: string;
        };
        if (!response.ok || !data.slides) {
          return data.error || "Impossible de réordonner.";
        }
        setSlides(
          data.slides.map((item) => ({
            ...item,
            source: "stored" as const,
          })),
        );
        return null;
      } catch {
        return "Impossible de réordonner.";
      } finally {
        setBusySlideId(null);
      }
    },
    [onUnauthorized],
  );

  return {
    slides,
    busySlideId,
    error,
    setError,
    load,
    reset,
    save,
    remove,
    reorder,
  };
}
