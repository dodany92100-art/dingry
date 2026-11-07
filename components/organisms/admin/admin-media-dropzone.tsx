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
        ? "border-amber-300/70 bg-amber-50/80"
        : "border-stone-200/90 bg-stone-50/60 hover:border-amber-200/80 hover:bg-amber-50/30"
      : dragOver
        ? "border-white/50 bg-zinc-800/80"
        : "border-zinc-700 bg-zinc-950/60 hover:border-zinc-500";

  return (
    <div className={tone === "ghost" ? "mt-0" : "mt-3"}>
      {label ? (
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">{label}</p>
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
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed px-3 py-5 transition duration-300 ${panelTone} disabled:opacity-50`}
      >
        {previewSrc ? (
          <span className="relative inline-block max-w-[14rem]">
            <img
              src={previewSrc}
              alt=""
              className={`h-36 w-full max-w-[11rem] rounded-md object-contain object-center sm:h-40 sm:max-w-[13rem] ${
                tone === "ghost" ? "border border-stone-200/90" : "rounded-sm border border-zinc-800 shadow-lg"
              }`}
            />
            <span
              role="button"
              tabIndex={0}
              aria-label="Supprimer le média"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (converting) return;
                pickFile(null);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                event.stopPropagation();
                if (!converting) pickFile(null);
              }}
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-xs leading-none text-stone-500 shadow-sm backdrop-blur-sm hover:border-red-300 hover:text-red-600"
            >
              ×
            </span>
          </span>
        ) : (
          <span
            className={`flex h-28 w-full max-w-[10rem] items-center justify-center rounded-md text-[9px] uppercase tracking-[0.2em] ${
              tone === "ghost"
                ? "border border-stone-200/90 bg-amber-50/25 text-stone-500"
                : "border border-zinc-800 bg-zinc-900 text-zinc-500"
            }`}
          >
            WebP
          </span>
        )}
        <span className="text-center text-[9px] uppercase tracking-[0.18em] text-stone-500">
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
