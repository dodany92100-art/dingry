"use client";

import { FormEvent, useEffect, useState } from "react";
import type { AdminCatalogPersoBanner } from "@/lib/admin/types";
import {
  appendPreuploadedImageFields,
  R2_PERSO_BANNER_FOLDER,
  type AdminImageUploadResponse,
} from "@/lib/client/admin-upload-image";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import { isR2PublicUrl } from "@/lib/r2/config";
import type { SavePersoBannerResult } from "./hooks/use-admin-catalog-perso-banner";
import { useAdminUploadGuard } from "./hooks/use-admin-upload-guard";

type CatalogPersoBannerTabProps = {
  banner: AdminCatalogPersoBanner;
  customized: boolean;
  saving: boolean;
  error: string;
  onSave: (formData: FormData) => Promise<SavePersoBannerResult>;
};

export function CatalogPersoBannerTab({
  banner,
  customized,
  saving,
  error,
  onSave,
}: CatalogPersoBannerTabProps) {
  const [enabled, setEnabled] = useState(banner.enabled);
  const [eyebrow, setEyebrow] = useState(banner.eyebrow);
  const [title, setTitle] = useState(banner.title);
  const [subtitle, setSubtitle] = useState(banner.subtitle);
  const [ctaLabel, setCtaLabel] = useState(banner.ctaLabel);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preuploaded, setPreuploaded] = useState<AdminImageUploadResponse | null>(null);
  const [imagePreview, setImagePreview] = useState(banner.imageUrl);
  const [convertingImage, setConvertingImage] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setEnabled(banner.enabled);
    setEyebrow(banner.eyebrow);
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setCtaLabel(banner.ctaLabel);
    if (!imageFile) setImagePreview(banner.imageUrl);
  }, [banner, imageFile]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function handleImageChange(file: File | null) {
    if (!file) {
      if (convertingImage || saving) return;
      setImageFile(null);
      setPreuploaded(null);
      setImagePreview(banner.imageUrl);
      return;
    }
    const priorPreview = imagePreview;
    const priorPreuploaded = preuploaded;
    setConvertingImage(true);
    setFormError("");
    const result = await prepareAndUploadAdminImage(file, {
      folder: R2_PERSO_BANNER_FOLDER,
      contentImage: true,
    });
    setConvertingImage(false);
    if (!result.ok) {
      setFormError(result.error);
      setImageFile(null);
      setPreuploaded(priorPreuploaded);
      setImagePreview(priorPreview);
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
    setFormError("");
    if (convertingImage) {
      setFormError("Attendez la fin de l’upload R2 avant d’enregistrer.");
      return;
    }
    const hasNewImage = Boolean(imageFile || preuploaded?.url);
    const hasCrmR2Image = isR2PublicUrl(banner.imageUrl) || isR2PublicUrl(imagePreview);
    if (!hasNewImage && !hasCrmR2Image) {
      setFormError("Ajoutez un visuel WebP — upload obligatoire (stockage R2, pas d’URL externe).");
      return;
    }
    const formData = new FormData();
    formData.set("enabled", enabled ? "true" : "false");
    formData.set("eyebrow", eyebrow.trim());
    formData.set("title", title.trim());
    formData.set("subtitle", subtitle.trim());
    formData.set("ctaLabel", ctaLabel.trim());
    if (imageFile) formData.set("image", imageFile);
    else {
      appendPreuploadedImageFields(formData, preuploaded);
      if (!preuploaded?.url && isR2PublicUrl(imagePreview)) {
        formData.set("imageUrl", imagePreview.trim());
        if (banner.blobPathname) formData.set("imageBlobPathname", banner.blobPathname);
      }
    }
    const result = await onSave(formData);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setImageFile(null);
    setPreuploaded(null);
  }

  const busy = saving || convertingImage;
  useAdminUploadGuard(busy);

  return (
    <div>
      <div className="mb-6 max-w-xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Bannière boutique</p>
        <p className="mt-1 text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
          Bandeau au-dessus de la grille catalogue · ouvre le configurateur tee personnalisé. Visuel WebP
          recommandé (paysage large).
          {customized ? null : (
            <span className="mt-2 block text-white/45">
              Textes par défaut ci-dessous. Uploadez un visuel WebP (R2) puis enregistrez dans Supabase.
            </span>
          )}
        </p>
      </div>

      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      {formError ? <p className="mb-3 text-sm text-red-400">{formError}</p> : null}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="dingry-admin-stock max-w-xl border border-white/10 p-4 md:p-6"
      >
        <label className="mb-5 flex items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="size-4 accent-[#FF3D00]"
          />
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/80">Afficher sur la boutique</span>
        </label>

        <div className="mb-5 overflow-hidden border border-white/10">
          {imagePreview.trim() ? (
            <img src={imagePreview} alt="" className="aspect-[21/9] w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <p className="flex aspect-[21/9] w-full items-center justify-center bg-white/[0.04] text-[10px] uppercase tracking-[0.2em] text-white/35">
              Visuel R2 requis
            </p>
          )}
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/45">
            Nouveau visuel (WebP · 1 Mo max)
          </span>
          {convertingImage ? (
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-amber-300/90">
              Upload R2 en cours… ne rechargez pas la page.
            </p>
          ) : null}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(event) => void handleImageChange(event.target.files?.[0] ?? null)}
            className="block w-full text-[11px] text-white/60 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-[10px] file:uppercase file:tracking-widest file:text-white disabled:opacity-40"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/45">Sur-titre</span>
          <input
            value={eyebrow}
            onChange={(event) => setEyebrow(event.target.value)}
            className="w-full border border-white/15 bg-[#080808] px-3 py-2.5 text-sm text-white"
            required
          />
        </label>

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
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/45">Sous-titre</span>
          <input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            className="w-full border border-white/15 bg-[#080808] px-3 py-2.5 text-sm text-white"
            required
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/45">Bouton</span>
          <input
            value={ctaLabel}
            onChange={(event) => setCtaLabel(event.target.value)}
            className="w-full border border-white/15 bg-[#080808] px-3 py-2.5 text-sm text-white"
            required
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="h-10 w-full bg-[#FF3D00] text-[11px] font-medium uppercase tracking-[0.2em] text-white disabled:opacity-40"
        >
          {busy ? "Enregistrement…" : "Enregistrer la bannière"}
        </button>
      </form>
    </div>
  );
}
