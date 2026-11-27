"use client";

import { useCallback, useState } from "react";
import type { AdminActionToastState } from "@/components/organisms/admin/admin-action-toast";
import type { AdminLookbookSlide, AdminLookbookSlideView } from "@/lib/admin/types";
import {
  applyLookbookOrderMove,
  defaultLookbookTitleFromFile,
  LOOKBOOK_BATCH_UPLOAD_MAX,
  lookbookBatchCountInvalid,
} from "@/lib/admin/lookbook-limits";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import { appendPreuploadedImageFields, R2_LOOKBOOK_STAGING_FOLDER } from "@/lib/client/admin-upload-image";

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
  const [batchImporting, setBatchImporting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<AdminActionToastState>(null);

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
    async (
      editingId: string | null,
      formData: FormData,
      options?: { quiet?: boolean },
    ): Promise<SaveLookbookResult> => {
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
        if (!options?.quiet) {
          setToast({
            variant: "success",
            message: editingId
              ? "Slide mise à jour — visible sur la boutique (lookbook en ligne)."
              : "Slide en ligne — visible sur la boutique (lookbook).",
          });
        }
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

  const importBatch = useCallback(
    async (files: File[]): Promise<string | null> => {
      if (lookbookBatchCountInvalid(files.length)) {
        return `Sélectionnez entre 1 et ${LOOKBOOK_BATCH_UPLOAD_MAX} fichiers.`;
      }
      setError("");
      setBatchImporting(true);
      const created: AdminLookbookSlideView[] = [];
      try {
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          if (!file) continue;
          const uploaded = await prepareAndUploadAdminImage(file, {
            folder: R2_LOOKBOOK_STAGING_FOLDER,
            contentImage: true,
          });
          if (!uploaded.ok) {
            await load();
            return uploaded.error || `Échec sur « ${file.name} ».`;
          }
          const formData = new FormData();
          formData.set("title", defaultLookbookTitleFromFile(file, index));
          formData.set("caption", "");
          if (uploaded.uploaded) {
            appendPreuploadedImageFields(formData, uploaded.uploaded);
          } else if (uploaded.file) {
            formData.set("image", uploaded.file);
          } else {
            return `Fichier non pris en charge : ${file.name}.`;
          }
          const saved = await save(null, formData, { quiet: true });
          if ("error" in saved) {
            await load();
            return saved.error;
          }
          created.push({ ...saved.slide, source: "stored" });
        }
        if (created.length > 0) {
          setToast({
            variant: "success",
            message: `${created.length} visuel${created.length > 1 ? "s" : ""} publié${created.length > 1 ? "s" : ""} sur la boutique.`,
          });
        }
        return null;
      } catch {
        await load();
        return "Import en lot impossible.";
      } finally {
        setBatchImporting(false);
      }
    },
    [load, save],
  );

  const reorderDrop = useCallback(
    async (fromIndex: number, toIndex: number): Promise<string | null> => {
      setError("");
      const next = applyLookbookOrderMove(
        [...slides].sort((a, b) => a.sortOrder - b.sortOrder),
        fromIndex,
        toIndex,
      );
      if (!next) return null;
      const orderedIds = next.map((item) => item.id);
      setSlides(
        next.map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
      );
      setBusySlideId(orderedIds[0] ?? null);
      try {
        const response = await fetch("/api/admin/lookbook", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        });
        if (response.status === 401) {
          onUnauthorized();
          return "Session expirée.";
        }
        const data = (await response.json().catch(() => ({}))) as {
          slides?: AdminLookbookSlideView[];
          error?: string;
        };
        if (!response.ok || !data.slides) {
          await load();
          return data.error || "Impossible de réordonner.";
        }
        setSlides(data.slides);
        return null;
      } catch {
        await load();
        return "Impossible de réordonner.";
      } finally {
        setBusySlideId(null);
      }
    },
    [load, onUnauthorized, slides],
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

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    slides,
    busySlideId,
    batchImporting,
    error,
    setError,
    toast,
    dismissToast,
    load,
    reset,
    save,
    remove,
    reorder,
    reorderDrop,
    importBatch,
  };
}
