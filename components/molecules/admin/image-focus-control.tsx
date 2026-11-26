"use client";

import { useState, type DragEvent, type PointerEvent } from "react";
import { bannerObjectPosition, clampBannerFocusPercent } from "@/lib/catalog-perso-banner-focus";

type ImageFocusControlProps = {
  imageUrl: string;
  focusX: number;
  focusY: number;
  onChange: (next: { focusX: number; focusY: number }) => void;
  aspectClassName?: string;
  disabled?: boolean;
  /** Remplacement du visuel par glisser-déposer. */
  onDropFile?: (file: File) => void;
  /** Libellé du filigrane (défaut : glisser votre image). */
  dropHint?: string;
  uploading?: boolean;
  /**
   * `cart-drawer-ambience` — même proportions que le bandeau latéral panier / favoris (desktop).
   */
  frameVariant?: "default" | "cart-drawer-ambience";
};

export function ImageFocusControl({
  imageUrl,
  focusX,
  focusY,
  onChange,
  aspectClassName = "aspect-[21/9]",
  disabled = false,
  onDropFile,
  dropHint = "Glisser votre image",
  uploading = false,
  frameVariant = "default",
}: ImageFocusControlProps) {
  const [dragOver, setDragOver] = useState(false);
  const cartDrawerFrame = frameVariant === "cart-drawer-ambience";

  function setFromPointer(event: PointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onChange({
      focusX: clampBannerFocusPercent(x),
      focusY: clampBannerFocusPercent(y),
    });
  }

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled || !onDropFile) return;
      setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      if (disabled || !onDropFile) return;
      const file = event.dataTransfer.files?.[0];
      if (file?.type.startsWith("image/")) onDropFile(file);
    },
  };

  const activeBorder = dragOver
    ? "border-[#FF3D00]/60 ring-1 ring-[#FF3D00]/35"
    : "border-white/15";

  function FocalCanvas({ className }: { className: string }) {
    return (
      <button
        type="button"
        disabled={disabled || !imageUrl.trim()}
        onPointerDown={setFromPointer}
        className={`${className} overflow-hidden bg-black/40 ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"
        }`}
        aria-label="Choisir le point focal du visuel"
      >
        {imageUrl.trim() ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: bannerObjectPosition(focusX, focusY) }}
            draggable={false}
          />
        ) : null}
        {cartDrawerFrame ? (
          <span
            className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-black/45 via-black/15 to-transparent"
            aria-hidden
          />
        ) : null}
        {onDropFile && imageUrl.trim() ? (
          <span
            className={`pointer-events-none absolute inset-0 z-[4] flex items-center justify-center bg-black/30 text-center transition ${
              dragOver || uploading ? "opacity-95" : "opacity-[0.38]"
            }`}
            aria-hidden
          >
            <span className="px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
              {uploading ? "Upload…" : dropHint}
            </span>
          </span>
        ) : null}
        <span
          className="pointer-events-none absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#FF3D00] shadow-[0_0_0_1px_rgb(0_0_0/0.55)]"
          style={{ left: `${focusX}%`, top: `${focusY}%` }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0 z-[1] border border-dashed border-white/25"
          aria-hidden
        />
        {dragOver ? (
          <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/55 text-[10px] font-medium uppercase tracking-[0.22em] text-white">
            Déposer pour remplacer
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
        Cadrage · clic pour focaliser · glisser-déposer pour remplacer l&apos;image
        {cartDrawerFrame ? (
          <span className="mt-1 block text-white/30">
            Aperçu · bandeau panier / favoris desktop (≈31 % tiroir · plein écran)
          </span>
        ) : null}
      </p>
      <div {...dropHandlers} className={cartDrawerFrame ? undefined : "relative"}>
        {cartDrawerFrame ? (
          <div
            className={`flex h-[min(58dvh,520px)] w-full max-w-3xl overflow-hidden rounded-md border ${activeBorder}`}
          >
            <div className="relative min-h-0 min-w-0 flex-1">
              <FocalCanvas className="absolute inset-0 block border-0" />
            </div>
            <div
              className="flex w-[31%] max-w-[14rem] min-w-[5.5rem] shrink-0 flex-col border-l border-white/[0.08] bg-[#0a0a0a] shadow-[-12px_0_40px_rgba(0,0,0,0.35)]"
              aria-hidden
            >
              <div className="border-b border-white/[0.06] px-2 py-2.5">
                <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-white/35">Tiroir</span>
              </div>
              <div className="flex-1 bg-gradient-to-b from-white/[0.03] to-transparent" />
            </div>
          </div>
        ) : (
          <FocalCanvas
            className={`relative block w-full border ${aspectClassName} ${activeBorder}`}
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[9px] uppercase tracking-[0.16em] text-white/40">
            Horizontal · {focusX}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={focusX}
            disabled={disabled}
            onChange={(event) =>
              onChange({ focusX: clampBannerFocusPercent(Number(event.target.value)), focusY })
            }
            className="w-full accent-[#FF3D00]"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[9px] uppercase tracking-[0.16em] text-white/40">
            Vertical · {focusY}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={focusY}
            disabled={disabled}
            onChange={(event) =>
              onChange({ focusX, focusY: clampBannerFocusPercent(Number(event.target.value)) })
            }
            className="w-full accent-[#FF3D00]"
          />
        </label>
      </div>
    </div>
  );
}
