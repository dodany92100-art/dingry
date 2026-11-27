"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type PointerEvent } from "react";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import { R2_VITRINE_HERO_FOLDER } from "@/lib/client/admin-upload-image";
import {
  clampShopHeroFocalAxis,
  clampShopHeroScale,
  resolveShopHeroFraming,
  shopHeroFramingStyle,
  SHOP_HERO_ADMIN_PREVIEW_CLASS,
  SHOP_HERO_FOCAL_AXIS_MAX,
  SHOP_HERO_FOCAL_AXIS_MIN,
  SHOP_HERO_SCALE_MAX,
  SHOP_HERO_SCALE_MIN,
  type ShopHeroFramingMap,
  type ShopHeroSlideFraming,
} from "@/lib/shop-hero-framing";
import {
  ADMIN_CRM_GLASS_PANEL,
  ADMIN_CRM_VITRINE_PUBLISH_BTN,
  ADMIN_CRM_VITRINE_RESET_BTN,
} from "@/components/organisms/admin/admin-crm-field-styles";

const DROPPED_IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i;

function imageFileFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const file = dataTransfer.files?.[0];
  if (!file) return null;
  if (file.type.startsWith("image/")) return file;
  if (DROPPED_IMAGE_EXT.test(file.name)) return file;
  return null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ShopHeroFramingFieldProps = {
  slideId: string;
  label: string;
  imageUrl: string;
  defaultFraming: ShopHeroSlideFraming;
  framingMap: ShopHeroFramingMap;
  disabled?: boolean;
  resetVersion?: number;
  onDirtyChange?: (dirty: boolean) => void;
  onMapSaved: (map: ShopHeroFramingMap) => void;
  onImageSaved?: (slideId: string, imageUrl: string) => void;
  onImageCleared?: (slideId: string) => void;
};

export function ShopHeroFramingField({
  slideId,
  label,
  imageUrl,
  defaultFraming,
  framingMap,
  disabled = false,
  resetVersion = 0,
  onDirtyChange,
  onMapSaved,
  onImageSaved,
  onImageCleared,
}: ShopHeroFramingFieldProps) {
  const resolved = resolveShopHeroFraming(slideId, defaultFraming, framingMap);
  const [draft, setDraft] = useState<ShopHeroSlideFraming>(resolved);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [imageDragOver, setImageDragOver] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(imageUrl);
  const [previewHidden, setPreviewHidden] = useState(false);
  const dragRef = useRef(false);
  const previewRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (imageUploading || previewHidden) return;
    setPreviewSrc(imageUrl);
  }, [imageUrl, imageUploading, previewHidden]);

  const imageStyle = shopHeroFramingStyle(draft);
  const busy = disabled || imageUploading;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty]);

  useEffect(() => {
    if (resetVersion < 1) return;
    const next = resolveShopHeroFraming(slideId, defaultFraming, framingMap);
    setDraft(next);
    setDirty(false);
    setStatus("idle");
    setPreviewHidden(false);
  }, [resetVersion, slideId, defaultFraming, framingMap]);

  function discardLocalDraft() {
    const next = resolveShopHeroFraming(slideId, defaultFraming, framingMap);
    setDraft(next);
    setDirty(false);
    setStatus("idle");
  }

  async function handleImageDrop(file: File) {
    if (busy) return;
    setImageUploading(true);
    setStatus("idle");
    const result = await prepareAndUploadAdminImage(file, {
      folder: R2_VITRINE_HERO_FOLDER(slideId),
      contentImage: true,
    });
    if (!result.ok) {
      setImageUploading(false);
      setStatus("error");
      return;
    }
    const url = result.uploaded?.url?.trim() ?? "";
    if (!url) {
      setImageUploading(false);
      setStatus("error");
      return;
    }
    try {
      const response = await fetch("/api/admin/shop/hero-media", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slideId, imageUrl: url }),
      });
      if (!response.ok) {
        setStatus("error");
        setImageUploading(false);
        return;
      }
      setPreviewSrc(url);
      setPreviewHidden(false);
      onImageSaved?.(slideId, url);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setImageUploading(false);
      setImageDragOver(false);
    }
  }

  const setFromPointer = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (busy) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setDraft((prev) => ({
        focalX: clampShopHeroFocalAxis(x),
        focalY: clampShopHeroFocalAxis(y),
        scale: prev.scale,
      }));
      setDirty(true);
      setStatus("idle");
    },
    [busy],
  );

  async function clearUploadedImage() {
    if (busy || !previewSrc.trim()) return;
    if (
      !window.confirm(
        `Retirer le visuel de « ${label} » ? Glissez une nouvelle image pour le remplacer ; le cadrage actuel est conservé.`,
      )
    ) {
      return;
    }
    setStatus("saving");
    setImageUploading(true);
    try {
      const mediaRes = await fetch("/api/admin/shop/hero-media", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slideId, clear: true }),
      });
      if (!mediaRes.ok) {
        setStatus("error");
        return;
      }
      onImageCleared?.(slideId);
      setPreviewSrc("");
      setPreviewHidden(true);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setImageUploading(false);
    }
  }

  async function resetToFactory() {
    if (busy) return;
    if (
      !window.confirm(
        `Réinitialiser « ${label} » ? Cadrage et image repassent sur les réglages d’origine de la vitrine.`,
      )
    ) {
      return;
    }
    setStatus("saving");
    setImageUploading(true);
    try {
      const [framingRes, mediaRes] = await Promise.all([
        fetch("/api/admin/shop/hero-framing", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slideId, framing: defaultFraming }),
        }),
        fetch("/api/admin/shop/hero-media", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slideId, clear: true }),
        }),
      ]);
      if (!framingRes.ok || !mediaRes.ok) {
        setStatus("error");
        return;
      }
      const framingPayload = (await framingRes.json()) as { framing?: ShopHeroFramingMap };
      if (framingPayload.framing) onMapSaved(framingPayload.framing);
      if (mediaRes.ok) onImageCleared?.(slideId);
      setDraft({ ...defaultFraming });
      setPreviewHidden(false);
      setDirty(false);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setImageUploading(false);
    }
  }

  async function save() {
    if (busy || !dirty || status === "saving") return;
    setStatus("saving");
    try {
      const response = await fetch("/api/admin/shop/hero-framing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slideId, framing: draft }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      const payload = (await response.json()) as { framing?: ShopHeroFramingMap };
      if (!payload.framing) {
        setStatus("error");
        return;
      }
      onMapSaved(payload.framing);
      setDirty(false);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className={`${ADMIN_CRM_GLASS_PANEL} space-y-4 p-4`}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Hero accueil</p>
          <p className="mt-1 text-xs font-medium tracking-[0.12em] text-white/80">{label}</p>
          <p className="mt-0.5 text-[9px] tracking-[0.08em] text-white/35">Aperçu comme sur mobile · plein écran vitrine</p>
        </div>
        <a
          href="/websitedx"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/60 transition hover:border-[#c9a227]/45 hover:text-[#d8b96a]"
        >
          Voir sur la vitrine
        </a>
      </div>
      <div
        className="relative overflow-hidden rounded-md border border-white/12 bg-black/50"
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          if (busy) return;
          setImageDragOver(true);
        }}
        onDragLeave={() => setImageDragOver(false)}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setImageDragOver(false);
          if (busy) return;
          const file = imageFileFromDataTransfer(event.dataTransfer);
          if (file) void handleImageDrop(file);
        }}
      >
        <div className={SHOP_HERO_ADMIN_PREVIEW_CLASS}>
          {previewSrc.trim() ? (
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-cover"
              style={{
                objectPosition: imageStyle.objectPosition,
                transform: imageStyle.transform,
                transformOrigin: imageStyle.transformOrigin,
              }}
              draggable={false}
            />
          ) : (
            <div className="h-full w-full bg-black/85" aria-hidden />
          )}
          {imageDragOver || imageUploading || !previewSrc.trim() ? (
            <div
              className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center bg-black/45 text-center"
              aria-hidden
            >
              <span className="px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
                {imageUploading ? "Upload…" : "Glisser votre image"}
              </span>
            </div>
          ) : null}
          {previewSrc.trim() ? (
            <span
              className="pointer-events-none absolute z-[2] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#FF3D00] shadow-[0_0_0_1px_rgb(0_0_0/0.55)]"
              style={{ left: `${draft.focalX}%`, top: `${draft.focalY}%` }}
              aria-hidden
            />
          ) : null}
          <button
            ref={previewRef}
            type="button"
            disabled={busy || !previewSrc.trim()}
            className="absolute inset-0 z-[3] cursor-crosshair touch-none"
            aria-label={`Cadrer ${label}`}
            onPointerDown={(event) => {
              dragRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              setFromPointer(event);
            }}
            onPointerMove={(event) => {
              if (!dragRef.current) return;
              setFromPointer(event);
            }}
            onPointerUp={(event) => {
              dragRef.current = false;
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => {
              dragRef.current = false;
            }}
            onWheel={(event) => {
              if (busy || !(event.ctrlKey || event.metaKey)) return;
              event.preventDefault();
              const step = Math.min(0.02, Math.abs(event.deltaY) * 0.0008);
              const delta = event.deltaY > 0 ? -step : step;
              setDraft((prev) => ({ ...prev, scale: clampShopHeroScale(prev.scale + delta) }));
              setDirty(true);
              setStatus("idle");
            }}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[9px] uppercase tracking-[0.14em] text-white/45">
            Gauche — droite · {draft.focalX}%
          </span>
          <input
            type="range"
            min={SHOP_HERO_FOCAL_AXIS_MIN}
            max={SHOP_HERO_FOCAL_AXIS_MAX}
            value={draft.focalX}
            disabled={busy}
            onChange={(event) => {
              setDraft((prev) => ({ ...prev, focalX: clampShopHeroFocalAxis(Number(event.target.value)) }));
              setDirty(true);
              setStatus("idle");
            }}
            className="w-full accent-[#FF3D00]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[9px] uppercase tracking-[0.14em] text-white/45">
            Haut — bas · {draft.focalY}%
          </span>
          <input
            type="range"
            min={SHOP_HERO_FOCAL_AXIS_MIN}
            max={SHOP_HERO_FOCAL_AXIS_MAX}
            value={draft.focalY}
            disabled={busy}
            onChange={(event) => {
              setDraft((prev) => ({ ...prev, focalY: clampShopHeroFocalAxis(Number(event.target.value)) }));
              setDirty(true);
              setStatus("idle");
            }}
            className="w-full accent-[#FF3D00]"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-[9px] uppercase tracking-[0.14em] text-white/45">
          Zoom · {Math.round(draft.scale * 100)}% <span className="text-white/30">(⌘ ou Ctrl + molette)</span>
        </span>
        <input
          type="range"
          min={Math.round(SHOP_HERO_SCALE_MIN * 100)}
          max={Math.round(SHOP_HERO_SCALE_MAX * 100)}
          value={Math.round(draft.scale * 100)}
          disabled={disabled}
          onChange={(event) => {
            setDraft((prev) => ({
              ...prev,
              scale: clampShopHeroScale(Number(event.target.value) / 100),
            }));
            setDirty(true);
            setStatus("idle");
          }}
          className="w-full accent-[#FF3D00]"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || !previewSrc.trim() || status === "saving"}
          onClick={() => void clearUploadedImage()}
          className="h-10 rounded-full border border-red-400/35 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300/90 transition hover:border-red-300/55 hover:text-red-200 disabled:opacity-35"
          title="Vider la zone pour glisser une nouvelle image"
        >
          Supprimer le visuel
        </button>
        <button
          type="button"
          disabled={busy || status === "saving"}
          onClick={() => void resetToFactory()}
          className={ADMIN_CRM_VITRINE_RESET_BTN}
        >
          Réinitialiser
        </button>
        <button
          type="button"
          disabled={busy || !dirty || status === "saving"}
          onClick={discardLocalDraft}
          className="h-10 rounded-full border border-white/20 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65 transition hover:border-white/35 hover:text-white disabled:opacity-35"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={busy || !dirty || status === "saving"}
          onClick={() => void save()}
          className={ADMIN_CRM_VITRINE_PUBLISH_BTN}
        >
          <span className="gold-text">{status === "saving" ? "Publication…" : "Mettre en ligne"}</span>
        </button>
        {status === "saved" ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-emerald-400/90">Vitrine à jour</span>
        ) : null}
        {status === "error" ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-red-400/90">Échec — réessaie</span>
        ) : null}
      </div>
    </div>
  );
}