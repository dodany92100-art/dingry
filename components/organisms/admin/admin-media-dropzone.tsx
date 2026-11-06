"use client";

import { useRef, useState } from "react";

type AdminMediaDropzoneProps = {
  previewSrc: string;
  converting: boolean;
  onFile: (file: File | null) => void;
};

export function AdminMediaDropzone({ previewSrc, converting, onFile }: AdminMediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function pickFile(file: File | null) {
    onFile(file);
  }

  return (
    <div className="mt-3">
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
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-4 py-6 transition duration-300 ${
          dragOver
            ? "border-white/50 bg-zinc-800/80"
            : "border-zinc-700 bg-zinc-950/60 hover:border-zinc-500"
        } disabled:opacity-50`}
      >
        {previewSrc ? (
          <span className="relative inline-block max-w-[14rem]">
            <img
              src={previewSrc}
              alt=""
              className="h-40 w-full max-w-[12rem] rounded-sm border border-zinc-800 object-contain object-center shadow-lg sm:h-44 sm:max-w-[14rem]"
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
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-950 text-sm leading-none text-zinc-300 hover:border-red-400 hover:text-red-300"
            >
              ×
            </span>
          </span>
        ) : (
          <span className="flex h-32 w-32 items-center justify-center rounded-sm border border-zinc-800 bg-zinc-900 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            WebP
          </span>
        )}
        <span className="text-center text-[10px] uppercase tracking-[0.16em] text-zinc-400">
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
