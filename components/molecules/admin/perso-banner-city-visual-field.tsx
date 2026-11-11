"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { PersoBannerCityId, PersoBannerCityVisual } from "@/lib/catalog-perso-banner-cities";
import { persoBannerCityFormPrefix } from "@/lib/catalog-perso-banner-cities";
import { CUSTOM_BANNER_CITIES } from "@/lib/custom-city-banner";
import {
  DEFAULT_PERSO_BANNER_FOCUS_X,
  DEFAULT_PERSO_BANNER_FOCUS_Y,
} from "@/lib/catalog-perso-banner-focus";
import { ATELIER_CITY_BANNER_IMAGE_MAX_LABEL } from "@/lib/admin/image-limits";
import { AdminImageDropField } from "@/components/molecules/admin/admin-image-drop-field";
import { ImageFocusControl } from "@/components/molecules/admin/image-focus-control";
import {
  R2_PERSO_BANNER_FOLDER,
  type AdminImageUploadResponse,
} from "@/lib/client/admin-upload-image";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import { isR2PublicUrl } from "@/lib/r2/config";

export type PersoBannerCityVisualFieldHandle = {
  appendToFormData: (formData: FormData) => void;
  isBusy: () => boolean;
};

type PersoBannerCityVisualFieldProps = {
  cityId: PersoBannerCityId;
  stored: PersoBannerCityVisual | undefined;
  disabled: boolean;
};

function cityUploadFolder(cityId: PersoBannerCityId): string {
  return `${R2_PERSO_BANNER_FOLDER}/cities/${cityId}`;
}

export const PersoBannerCityVisualField = forwardRef<
  PersoBannerCityVisualFieldHandle,
  PersoBannerCityVisualFieldProps
>(function PersoBannerCityVisualField({ cityId, stored, disabled }, ref) {
  const cityMeta = CUSTOM_BANNER_CITIES.find((city) => city.id === cityId);
  const label = cityMeta?.suggestion ?? cityId.toUpperCase();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preuploaded, setPreuploaded] = useState<AdminImageUploadResponse | null>(null);
  const [imagePreview, setImagePreview] = useState(stored?.imageUrl ?? "");
  const [convertingImage, setConvertingImage] = useState(false);
  const [focusX, setFocusX] = useState(stored?.imageFocusX ?? DEFAULT_PERSO_BANNER_FOCUS_X);
  const [focusY, setFocusY] = useState(stored?.imageFocusY ?? DEFAULT_PERSO_BANNER_FOCUS_Y);
  const [markedClear, setMarkedClear] = useState(false);

  useEffect(() => {
    if (!imageFile) setImagePreview(stored?.imageUrl ?? "");
    setFocusX(stored?.imageFocusX ?? DEFAULT_PERSO_BANNER_FOCUS_X);
    setFocusY(stored?.imageFocusY ?? DEFAULT_PERSO_BANNER_FOCUS_Y);
    if (stored?.imageUrl?.trim()) setMarkedClear(false);
  }, [stored, imageFile]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function handleImageChange(file: File | null) {
    if (!file) {
      if (convertingImage || disabled) return;
      setImageFile(null);
      setPreuploaded(null);
      setImagePreview(stored?.imageUrl ?? "");
      return;
    }
    setMarkedClear(false);
    setConvertingImage(true);
    const result = await prepareAndUploadAdminImage(file, {
      folder: cityUploadFolder(cityId),
      contentImage: true,
    });
    setConvertingImage(false);
    if (!result.ok) return;
    if (result.uploaded) {
      setPreuploaded(result.uploaded);
      setImageFile(null);
      setImagePreview(result.uploaded.url);
      return;
    }
    setPreuploaded(null);
    setImageFile(result.file);
  }

  useImperativeHandle(
    ref,
    () => ({
      isBusy: () => convertingImage,
      appendToFormData: (formData: FormData) => {
        const prefix = persoBannerCityFormPrefix(cityId);
        if (markedClear) {
          formData.set(`${prefix}_clear`, "true");
          return;
        }
        formData.set(`${prefix}_imageFocusX`, String(focusX));
        formData.set(`${prefix}_imageFocusY`, String(focusY));
        if (imageFile) {
          formData.set(`${prefix}_image`, imageFile);
          return;
        }
        if (preuploaded?.url) {
          formData.set(`${prefix}_preuploadImageUrl`, preuploaded.url);
          if (preuploaded.pathname) {
            formData.set(`${prefix}_preuploadBlobPathname`, preuploaded.pathname);
          }
          return;
        }
        if (isR2PublicUrl(imagePreview)) {
          formData.set(`${prefix}_imageUrl`, imagePreview.trim());
          const pathname = stored?.blobPathname;
          if (pathname) formData.set(`${prefix}_imageBlobPathname`, pathname);
        }
      },
    }),
    [cityId, convertingImage, focusX, focusY, imageFile, imagePreview, markedClear, preuploaded, stored?.blobPathname],
  );

  function removeVisual() {
    if (busy) return;
    setMarkedClear(true);
    setImageFile(null);
    setPreuploaded(null);
    setImagePreview("");
    setFocusX(DEFAULT_PERSO_BANNER_FOCUS_X);
    setFocusY(DEFAULT_PERSO_BANNER_FOCUS_Y);
  }

  const busy = disabled || convertingImage;
  const hasVisual = Boolean(imagePreview.trim());

  return (
    <fieldset className="mb-6 border border-white/10 p-4">
      <legend className="px-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
        Atelier · {label}
      </legend>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[9px] leading-relaxed tracking-[0.08em] text-white/35">
          Switch vitrine au clic {label}. WebP · {ATELIER_CITY_BANNER_IMAGE_MAX_LABEL} max.
        </p>
        {hasVisual ? (
          <button
            type="button"
            disabled={busy}
            onClick={removeVisual}
            className="shrink-0 border border-red-400/35 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-red-200/90 transition hover:bg-red-950/40 disabled:opacity-40"
          >
            Supprimer
          </button>
        ) : null}
      </div>
      <div className="mb-3">
        {imagePreview.trim() ? (
          <ImageFocusControl
            imageUrl={imagePreview}
            focusX={focusX}
            focusY={focusY}
            disabled={busy}
            onDropFile={(file) => void handleImageChange(file)}
            onChange={({ focusX: nextX, focusY: nextY }) => {
              setFocusX(nextX);
              setFocusY(nextY);
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
      <AdminImageDropField
        variant="compact"
        disabled={busy}
        converting={convertingImage}
        onFile={(file) => void handleImageChange(file)}
      />
    </fieldset>
  );
});
