"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  PersoBannerCityVisualField,
  type PersoBannerCityVisualFieldHandle,
} from "@/components/molecules/admin/perso-banner-city-visual-field";
import { PERSO_BANNER_CITY_IDS } from "@/lib/catalog-perso-banner-cities";
import type { AdminCatalogPersoBanner } from "@/lib/admin/types";
import {
  appendPreuploadedImageFields,
  R2_PERSO_BANNER_FOLDER,
  type AdminImageUploadResponse,
} from "@/lib/client/admin-upload-image";
import { AdminImageDropField } from "@/components/molecules/admin/admin-image-drop-field";
import { ImageFocusControl } from "@/components/molecules/admin/image-focus-control";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import {
  DEFAULT_PERSO_BANNER_FOCUS_X,
  DEFAULT_PERSO_BANNER_FOCUS_Y,
} from "@/lib/catalog-perso-banner-focus";
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
  const [imageFocusX, setImageFocusX] = useState(banner.imageFocusX ?? DEFAULT_PERSO_BANNER_FOCUS_X);
  const [imageFocusY, setImageFocusY] = useState(banner.imageFocusY ?? DEFAULT_PERSO_BANNER_FOCUS_Y);
  const [mainVisualCleared, setMainVisualCleared] = useState(false);
  const cityFieldRefs = useRef<Partial<Record<string, PersoBannerCityVisualFieldHandle | null>>>({});

  useEffect(() => {
    setEnabled(banner.enabled);
    setEyebrow(banner.eyebrow);
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setCtaLabel(banner.ctaLabel);
    if (!imageFile) setImagePreview(banner.imageUrl);
    setImageFocusX(banner.imageFocusX ?? DEFAULT_PERSO_BANNER_FOCUS_X);
    setImageFocusY(banner.imageFocusY ?? DEFAULT_PERSO_BANNER_FOCUS_Y);
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
    setMainVisualCleared(false);
  }

  function removeMainVisual() {
    if (busy) return;
    setMainVisualCleared(true);
    setImageFile(null);
    setPreuploaded(null);
    setImagePreview("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    if (convertingImage || PERSO_BANNER_CITY_IDS.some((id) => cityFieldRefs.current[id]?.isBusy())) {
      setFormError("Attendez la fin de l’upload R2 avant d’enregistrer.");
      return;
    }
    const hasNewImage = Boolean(imageFile || preuploaded?.url);
    const hasCrmR2Image =
      !mainVisualCleared && (isR2PublicUrl(banner.imageUrl) || isR2PublicUrl(imagePreview));
    const hasMarseilleR2 = isR2PublicUrl(banner.cityVisuals?.marseille?.imageUrl);
    if (!hasNewImage && !hasCrmR2Image && !hasMarseilleR2) {
      setFormError(
        "Ajoutez un visuel WebP — visuel principal ou atelier Marseille (R2, 1 Mo max).",
      );
      return;
    }
    const formData = new FormData();
    formData.set("enabled", enabled ? "true" : "false");
    formData.set("eyebrow", eyebrow.trim());
    formData.set("title", title.trim());
    formData.set("subtitle", subtitle.trim());
    formData.set("ctaLabel", ctaLabel.trim());
    formData.set("imageFocusX", String(imageFocusX));
    formData.set("imageFocusY", String(imageFocusY));
    if (mainVisualCleared) {
      formData.set("imageClear", "true");
    } else if (imageFile) {
      formData.set("image", imageFile);
    } else {
      appendPreuploadedImageFields(formData, preuploaded);
      if (!preuploaded?.url && isR2PublicUrl(imagePreview)) {
        formData.set("imageUrl", imagePreview.trim());
        if (banner.blobPathname) formData.set("imageBlobPathname", banner.blobPathname);
      }
    }
    for (const cityId of PERSO_BANNER_CITY_IDS) {
      cityFieldRefs.current[cityId]?.appendToFormData(formData);
    }
    const result = await onSave(formData);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setImageFile(null);
    setPreuploaded(null);
    setMainVisualCleared(false);
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
        className="dingry-admin-stock dingry-admin-glass max-w-xl rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/15 md:p-6"
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

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[9px] leading-relaxed tracking-[0.08em] text-white/40">
            Visuel principal CRM : synchronisé sur <strong className="font-medium text-white/55">Marseille</strong>{" "}
            à l&apos;enregistrement si le bloc atelier Marseille est renseigné.
          </p>
          {imagePreview.trim() ? (
            <button
              type="button"
              disabled={busy}
              onClick={removeMainVisual}
              className="shrink-0 border border-red-400/35 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-red-200/90 transition hover:bg-red-950/40 disabled:opacity-40"
            >
              Supprimer
            </button>
          ) : null}
        </div>
        <div className="mb-5">
          {imagePreview.trim() ? (
            <ImageFocusControl
              imageUrl={imagePreview}
              focusX={imageFocusX}
              focusY={imageFocusY}
              disabled={busy}
              onDropFile={(file) => void handleImageChange(file)}
              onChange={({ focusX, focusY }) => {
                setImageFocusX(focusX);
                setImageFocusY(focusY);
              }}
            />
          ) : (
            <AdminImageDropField
              variant="empty"
              disabled={busy}
              converting={convertingImage}
              onFile={(file) => void handleImageChange(file)}
            />
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
          <AdminImageDropField
            variant="compact"
            disabled={busy}
            converting={convertingImage}
            onFile={(file) => void handleImageChange(file)}
          />
        </label>

        <div className="mb-4 border-t border-white/10 pt-5">
          <p className="mb-4 text-[10px] uppercase tracking-[0.22em] text-white/45">
            Visuels atelier (switch Paris · Marseille · Lyon)
          </p>
          {PERSO_BANNER_CITY_IDS.map((cityId) => (
            <PersoBannerCityVisualField
              key={cityId}
              ref={(node) => {
                cityFieldRefs.current[cityId] = node;
              }}
              cityId={cityId}
              stored={banner.cityVisuals?.[cityId]}
              disabled={busy}
            />
          ))}
        </div>

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
