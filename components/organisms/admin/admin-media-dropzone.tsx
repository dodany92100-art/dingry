"use client";

import { useRef, useState } from "react";

type AdminMediaDropzoneProps = {
  /** Libellé au-dessus de la zone (ex. Recto / Verso). */
  label?: string;
  /** Bordure discrète type « ghost » (CRM minimal). */
  tone?: "default" | "ghost";
  /** Zone produit : visuels plus grands, chrome resserré (Linear). */
  density?: "default" | "compact";
  previewSrc: string;
  converting: boolean;
  onFile: (file: File | null) => void;
};

export function AdminMediaDropzone({
  label,
  tone = "default",
  density = "default",
  previewSrc,
  converting,
  onFile,
}: AdminMediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function pickFile(file: File | null) {
    onFile(file);
  }

  const compact = density === "compact";

  const panelTone = compact
    ? dragOver
      ? "border-white/20 bg-[#141414] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      : "border-white/[0.08] bg-[#0c0c0c] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-white/14 hover:bg-[#101010]"
    : tone === "ghost"
      ? dragOver
        ? "border-white/22 bg-[#1a1a1a]"
        : "dingry-admin-panel-muted hover:border-white/16 hover:bg-[#161616]"
      : dragOver
        ? "border-white/24 bg-[#1a1a1a]"
        : "dingry-admin-panel-muted hover:border-white/20";

  return (
    <div className={tone === "ghost" || compact ? "mt-0" : "mt-3"}>
      {label ? (
        <p
          className={`font-medium uppercase tracking-[0.14em] ${
            compact
              ? "mb-1 text-[9px] text-white/45"
              : `mb-2 text-sm ${tone === "ghost" ? "text-zinc-500" : "text-zinc-400"}`
          }`}
        >
          {label}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={converting}
        className="sr-only"
        onChange={(event) => {
          pickFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={converting ? -1 : 0}
        aria-disabled={converting}
        onClick={() => {
          if (converting) return;
          inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (converting) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files?.[0] ?? null;
          pickFile(file);
        }}
        className={`flex w-full flex-col items-center justify-center overflow-visible border transition duration-200 ${
          compact
            ? "min-h-[9.5rem] gap-1 rounded-xl px-2 py-2 sm:min-h-[11rem]"
            : "gap-3 rounded-md border-dashed px-3 py-5"
        } ${panelTone} ${converting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        {previewSrc ? (
          <span
            className={`relative overflow-visible ${compact ? "block w-full max-w-none" : "inline-block max-w-[14rem]"}`}
          >
            <img
              src={previewSrc}
              alt=""
              className={
                compact
                  ? "mx-auto h-[9rem] w-full max-h-[12.5rem] rounded-lg border border-white/[0.1] object-contain object-center shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:h-[10.5rem] lg:h-[11.5rem]"
                  : `h-36 w-full max-w-[11rem] rounded-md object-contain object-center sm:h-40 sm:max-w-[13rem] ${
                      tone === "ghost" ? "border border-white/15" : "rounded-sm border border-white/15 shadow-lg"
                    }`
              }
            />
            <button
              type="button"
              aria-label="Supprimer le média"
              disabled={converting}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (converting) return;
                pickFile(null);
              }}
              className={`absolute right-0.5 top-0.5 z-20 flex touch-manipulation items-center justify-center rounded-full border border-white/25 bg-black/80 font-medium leading-none text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-sm hover:border-red-400/55 hover:bg-red-950/90 hover:text-red-100 disabled:opacity-50 ${
                compact
                  ? "h-7 w-7 text-sm"
                  : "h-10 w-10 text-lg sm:right-1 sm:top-1 sm:h-8 sm:w-8 sm:text-base"
              }`}
            >
              ×
            </button>
          </span>
        ) : (
          <span
            className={`flex w-full items-center justify-center rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-white/40 ${
              compact ? "h-[9rem] max-w-none text-[10px] sm:h-[10.5rem]" : "h-28 max-w-[10rem] text-xs text-zinc-500"
            }`}
          >
            WebP
          </span>
        )}
        <span
          className={`text-center ${compact ? "px-0.5 text-[9px] leading-snug text-white/38" : "text-sm text-zinc-500"}`}
        >
          {converting
            ? "Conversion WebP…"
            : previewSrc
              ? "Glisser ou cliquer pour remplacer"
              : "Dropzone · glisser une image ou parcourir"}
        </span>
      </div>
    </div>
  );
}
