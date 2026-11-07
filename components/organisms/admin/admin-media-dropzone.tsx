"use client";

import { useRef, useState } from "react";

type AdminMediaDropzoneProps = {
  /** Libellé au-dessus de la zone (ex. Recto / Verso). */
  label?: string;
  /** Bordure discrète type « ghost » (CRM minimal). */
  tone?: "default" | "ghost";
  previewSrc: string;
  converting: boolean;
  onFile: (file: File | null) => void;
};

export function AdminMediaDropzone({
  label,
  tone = "default",
  previewSrc,
  converting,
  onFile,
}: AdminMediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function pickFile(file: File | null) {
    onFile(file);
  }

  const panelTone =
    tone === "ghost"
      ? dragOver
        ? "border-white/30 bg-[#121c30]"
        : "dingry-admin-panel-muted hover:border-white/20 hover:bg-[#0e1628]"
      : dragOver
        ? "border-white/35 bg-[#121c30]"
        : "dingry-admin-panel-muted hover:border-white/20";

  return (
    <div className={tone === "ghost" ? "mt-0" : "mt-3"}>
      {label ? (
        <p
          className={`mb-2 text-sm font-medium ${
            tone === "ghost" ? "text-zinc-500" : "text-zinc-400"
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
      <button
        type="button"
        disabled={converting}
        onClick={() => inputRef.current?.click()}
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
        className={`flex w-full flex-col items-center justify-center gap-3 overflow-visible rounded-md border border-dashed px-3 py-5 transition duration-300 ${panelTone} disabled:opacity-50`}
      >
        {previewSrc ? (
          <span className="relative inline-block max-w-[14rem] overflow-visible">
            <img
              src={previewSrc}
              alt=""
              className={`h-36 w-full max-w-[11rem] rounded-md object-contain object-center sm:h-40 sm:max-w-[13rem] ${
                tone === "ghost" ? "border border-white/15" : "rounded-sm border border-white/15 shadow-lg"
              }`}
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
              className="absolute right-0.5 top-0.5 z-20 flex h-10 w-10 touch-manipulation items-center justify-center rounded-full border border-white/30 bg-black/75 text-lg font-medium leading-none text-white shadow-[0_2px_10px_rgba(0,0,0,0.45)] backdrop-blur-sm hover:border-red-400/55 hover:bg-red-950/90 hover:text-red-100 disabled:opacity-50 sm:right-1 sm:top-1 sm:h-8 sm:w-8 sm:text-base"
            >
              ×
            </button>
          </span>
        ) : (
          <span
            className={`flex h-28 w-full max-w-[10rem] items-center justify-center rounded-md text-xs text-zinc-500 ${
              tone === "ghost"
                ? "border border-white/15 bg-[#0a101c] text-white/45"
                : "border border-white/15 bg-[#0a101c] text-white/45"
            }`}
          >
            WebP
          </span>
        )}
        <span className="text-center text-sm text-zinc-500">
          {converting
            ? "Conversion WebP…"
            : previewSrc
              ? "Glisser ou cliquer pour remplacer"
              : "Dropzone · glisser une image ou parcourir"}
        </span>
      </button>
    </div>
  );
}
