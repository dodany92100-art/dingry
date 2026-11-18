"use client";

import { useEffect, useState } from "react";
import { AdminImageDropField } from "@/components/molecules/admin/admin-image-drop-field";
import { ImageFocusControl } from "@/components/molecules/admin/image-focus-control";
import {
  ADMIN_CRM_EYEBROW,
  ADMIN_CRM_GLASS_PANEL,
} from "@/components/organisms/admin/admin-crm-field-styles";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import { R2_ATELIER_SECTION_HERO_FOLDER } from "@/lib/client/admin-upload-image";
import type { AtelierSectionHero } from "@/lib/atelier-custom-config";
import { DINGRY_ATELIER_HERO_SRC } from "@/lib/dingry-brand";

type AtelierSectionHeroFieldProps = {
  value: AtelierSectionHero;
  disabled?: boolean;
  onChange: (next: AtelierSectionHero) => void;
  onBusyChange?: (busy: boolean) => void;
};

export function AtelierSectionHeroField({
  value,
  disabled = false,
  onChange,
  onBusyChange,
}: AtelierSectionHeroFieldProps) {
  const [preview, setPreview] = useState(value.imageUrl || DINGRY_ATELIER_HERO_SRC);
  const [converting, setConverting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!converting) setPreview(value.imageUrl || DINGRY_ATELIER_HERO_SRC);
  }, [converting, value.imageUrl]);

  useEffect(() => {
    onBusyChange?.(converting);
  }, [converting, onBusyChange]);

  async function handleFile(file: File | null) {
    if (!file) return;
    setConverting(true);
    setFormError("");
    const result = await prepareAndUploadAdminImage(file, {
      folder: R2_ATELIER_SECTION_HERO_FOLDER,
      contentImage: true,
    });
    setConverting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    if (result.uploaded?.url) {
      onChange({ ...value, imageUrl: result.uploaded.url });
      setPreview(result.uploaded.url);
      return;
    }
    if (result.file) {
      const blobUrl = URL.createObjectURL(result.file);
      setPreview(blobUrl);
    }
  }

  function removeHero() {
    if (disabled || converting) return;
    onChange({ ...value, imageUrl: DINGRY_ATELIER_HERO_SRC });
    setPreview(DINGRY_ATELIER_HERO_SRC);
  }

  const busy = disabled || converting;
  const customHero = value.imageUrl.trim() !== DINGRY_ATELIER_HERO_SRC;

  return (
    <section className={ADMIN_CRM_GLASS_PANEL}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Section vitrine (bas de page)</p>
      <p className="mt-1 text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
        Même bloc que l&apos;accueil <code className="text-white/45">#atelier-custom-hero</code> — textes via i18n
        boutique (sur-titre, titre, chapô, CTA).
      </p>
      {formError ? <p className="mt-3 text-sm text-red-400">{formError}</p> : null}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <span className={ADMIN_CRM_EYEBROW}>Visuel plein écran (WebP · 1 Mo max)</span>
        {customHero ? (
          <button
            type="button"
            disabled={busy}
            onClick={removeHero}
            className="shrink-0 border border-red-400/35 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-red-200/90 hover:bg-red-950/40 disabled:opacity-40"
          >
            Visuel par défaut
          </button>
        ) : null}
      </div>
      <div className="mt-3">
        {preview.trim() ? (
          <ImageFocusControl
            imageUrl={preview}
            focusX={value.imageFocusX}
            focusY={value.imageFocusY}
            disabled={busy}
            onDropFile={(file) => void handleFile(file)}
            onChange={({ focusX, focusY }) => onChange({ ...value, imageFocusX: focusX, imageFocusY: focusY })}
          />
        ) : (
          <AdminImageDropField variant="empty" disabled={busy} converting={converting} onFile={(file) => void handleFile(file)} />
        )}
      </div>
      <label className="mt-4 block">
        <span className={ADMIN_CRM_EYEBROW}>Remplacer le visuel</span>
        {converting ? (
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-amber-300/90">Upload R2…</p>
        ) : null}
        <AdminImageDropField variant="compact" disabled={busy} converting={converting} onFile={(file) => void handleFile(file)} />
      </label>
    </section>
  );
}