"use client";

import { FormEvent, useEffect, useState } from "react";
import type { AdminLookbookSlide } from "@/lib/admin/types";
import {
  appendPreuploadedImageFields,
  R2_LOOKBOOK_FOLDER,
  R2_LOOKBOOK_STAGING_FOLDER,
  type AdminImageUploadResponse,
} from "@/lib/client/admin-upload-image";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import type { SaveLookbookResult } from "./hooks/use-admin-lookbook";

type LookbookEditorModalProps = {
  initial: AdminLookbookSlide | null;
  busySlideId: string | null;
  onClose: () => void;
  onSubmit: (editingId: string | null, formData: FormData) => Promise<SaveLookbookResult>;
  onDelete: (slide: AdminLookbookSlide) => Promise<boolean>;
};

export function LookbookEditorModal({
  initial,
  busySlideId,
  onClose,
  onSubmit,
  onDelete,
}: LookbookEditorModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preuploaded, setPreuploaded] = useState<AdminImageUploadResponse | null>(null);
  const [imagePreview, setImagePreview] = useState(initial?.imageUrl ?? "");
  const [convertingImage, setConvertingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const editingId = initial?.id ?? null;
  const busy = saving || convertingImage || (editingId !== null && busySlideId === editingId);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function handleImageChange(file: File | null) {
    if (!file) {
      setImageFile(null);
      setPreuploaded(null);
      if (initial) setImagePreview(initial.imageUrl);
      return;
    }
    setConvertingImage(true);
    setFormError("");
    const folder = editingId ? R2_LOOKBOOK_FOLDER(editingId) : R2_LOOKBOOK_STAGING_FOLDER;
    const result = await prepareAndUploadAdminImage(file, { folder });
    setConvertingImage(false);
    if (!result.ok) {
      setFormError(result.error);
      setImageFile(null);
      setPreuploaded(null);
      return;
    }
    if (result.uploaded) {
      setPreuploaded(result.uploaded);
      setImageFile(null);
      setImagePreview(result.uploaded.url);
      return;
    }
    setPreuploaded(null);
    setImageFile(result.file);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setFormError("Le titre est requis.");
      return;
    }
    if (!editingId && !imageFile && !preuploaded?.url) {
      setFormError("Une image est requise.");
      return;
    }
    setSaving(true);
    setFormError("");
    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("caption", caption.trim());
    if (imageFile) formData.set("image", imageFile);
    else appendPreuploadedImageFields(formData, preuploaded);
    const result = await onSubmit(editingId, formData);
    setSaving(false);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[rgba(0,0,0,0.8)] p-4 pb-10 sm:p-8">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-lg border border-white/10 bg-[#0a0a0a] p-5 md:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#FF3D00]">Lookbook</p>
            <h2 className="mt-2 text-lg font-bold uppercase tracking-wide">
              {editingId ? "Modifier la slide" : "Nouvelle slide"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {formError ? <p className="mb-4 text-sm text-red-400">{formError}</p> : null}

        <label className="mb-4 block">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/45">Titre</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full border border-white/15 bg-[#080808] px-3 py-2.5 text-sm text-white"
            required
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/45">Légende</span>
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            className="w-full border border-white/15 bg-[#080808] px-3 py-2.5 text-sm text-white"
          />
        </label>

        <div className="mb-6">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/45">
            Image {editingId ? "(optionnel)" : ""}
          </span>
          {imagePreview ? (
            <img src={imagePreview} alt="" className="mb-3 aspect-[3/4] w-full max-w-[200px] object-cover" />
          ) : null}
          <input
            type="file"
            accept="image/*"
            disabled={convertingImage}
            onChange={(event) => void handleImageChange(event.target.files?.[0] ?? null)}
            className="block w-full text-xs text-white/55"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-black disabled:opacity-40"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {initial ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDelete(initial).then((ok) => ok && onClose())}
              className="border border-red-500/40 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-red-400 disabled:opacity-40"
            >
              Supprimer
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
