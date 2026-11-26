"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type PointerEvent } from "react";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import { R2_VITRINE_HERO_FOLDER } from "@/lib/client/admin-upload-image";
import {
  clampShopHeroFocalAxis,
  clampShopHeroScale,
  resolveShopHeroFraming,
  shopHeroFramingStyle,
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
  const dragRef = useRef(false);
  const previewRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!imageUploading) setPreviewSrc(imageUrl);
  }, [imageUrl, imageUploading]);

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
    const url = result.uploaded?.url ?? "";
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
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Hero accueil</p>
        <p className="mt-1 text-xs font-medium tracking-[0.12em] text-white/80">{label}</p>
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
          const file = event.dataTransfer.files?.[0];
          if (file?.type.startsWith("image/")) void handleImageDrop(file);
        }}
      >
        <div className="relative aspect-[21/9] w-full overflow-hidden">
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
          <div
            className={`pointer-events-none absolute inset-0 z-[4] flex items-center justify-center bg-black/30 text-center transition ${
              imageDragOver ? "opacity-95" : "opacity-[0.38]"
            }`}
            aria-hidden
          >
            <span className="px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
              {imageUploading ? "Upload…" : "Glisser votre image"}
            </span>
          </div>
          <span
            className="pointer-events-none absolute z-[2] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#FF3D00] shadow-[0_0_0_1px_rgb(0_0_0/0.55)]"
            style={{ left: `${draft.focalX}%`, top: `${draft.focalY}%` }}
            aria-hidden
          />
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
              if (busy) return;
              event.preventDefault();
              const delta = event.deltaY > 0 ? -0.04 : 0.04;
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
          Zoom · {Math.round(draft.scale * 100)}%
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