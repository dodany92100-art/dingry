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
};

export function ImageFocusControl({
  imageUrl,
  focusX,
  focusY,
  onChange,
  aspectClassName = "aspect-[21/9]",
  disabled = false,
  onDropFile,
}: ImageFocusControlProps) {
  const [dragOver, setDragOver] = useState(false);

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

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
        Cadrage · clic pour focaliser · glisser-déposer pour remplacer l&apos;image
      </p>
      <div
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          if (disabled || !onDropFile) return;
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragOver(false);
          if (disabled || !onDropFile) return;
          const file = event.dataTransfer.files?.[0];
          if (file?.type.startsWith("image/")) onDropFile(file);
        }}
        className="relative"
      >
      <button
        type="button"
        disabled={disabled || !imageUrl.trim()}
        onPointerDown={setFromPointer}
        className={`relative block w-full overflow-hidden border bg-black/40 ${aspectClassName} ${
          dragOver ? "border-[#FF3D00]/60 ring-1 ring-[#FF3D00]/35" : "border-white/15"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"}`}
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
