"use client";

import { FormEvent, useEffect, useState } from "react";
import type { AdminCatalogPersoBanner } from "@/lib/admin/types";
import { prepareProductImage } from "@/lib/client/prepare-product-image";
import type { SavePersoBannerResult } from "./hooks/use-admin-catalog-perso-banner";

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
      setImageFile(null);
      setImagePreview(banner.imageUrl);
      return;
    }
    setConvertingImage(true);
    setFormError("");
    try {
      const prepared = await prepareProductImage(file);
      setImageFile(prepared);
    } catch {
      setFormError("Image invalide ou conversion impossible.");
      setImageFile(null);
    } finally {
      setConvertingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const formData = new FormData();
    formData.set("enabled", enabled ? "true" : "false");
    formData.set("eyebrow", eyebrow.trim());
    formData.set("title", title.trim());
    formData.set("subtitle", subtitle.trim());
    formData.set("ctaLabel", ctaLabel.trim());
    if (imageFile) formData.set("image", imageFile);
    const result = await onSave(formData);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setImageFile(null);
  }

  const busy = saving || convertingImage;

  return (
    <div>
      <div className="mb-6 max-w-xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Bannière boutique</p>
        <p className="mt-1 text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
          Bandeau au-dessus de la grille catalogue · ouvre le configurateur tee personnalisé. Visuel WebP
          recommandé (paysage large).
          {customized ? null : (
            <span className="mt-2 block text-white/45">
              Valeurs actuelles = défaut boutique (Cloudinary). Enregistrer pour figer dans le CRM.
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
            className="size-4 accent-[#0066FF]"
          />
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/80">Afficher sur la boutique</span>
        </label>

        <div className="mb-5 overflow-hidden border border-white/10">
          <img src={imagePreview} alt="" className="aspect-[21/9] w-full object-cover" loading="lazy" decoding="async" />
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/45">Nouveau visuel (WebP)</span>
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(event) => void handleImageChange(event.target.files?.[0] ?? null)}
            className="block w-full text-[11px] text-white/60 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-[10px] file:uppercase file:tracking-widest file:text-white"
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
          className="h-10 w-full bg-[#0066FF] text-[11px] font-medium uppercase tracking-[0.2em] text-white disabled:opacity-40"
        >
          {busy ? "Enregistrement…" : "Enregistrer la bannière"}
        </button>
      </form>
    </div>
  );
}
