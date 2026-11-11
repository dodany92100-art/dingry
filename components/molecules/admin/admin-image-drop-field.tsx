"use client";

import { useRef, useState, type DragEvent } from "react";

function imageFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const file = dataTransfer.files?.[0];
  if (!file || !file.type.startsWith("image/")) return null;
  return file;
}

type AdminImageDropFieldProps = {
  disabled?: boolean;
  converting?: boolean;
  onFile: (file: File) => void;
  /** Zone large 21/9 sans visuel, ou bande compacte de remplacement. */
  variant?: "empty" | "compact";
};

export function AdminImageDropField({
  disabled = false,
  converting = false,
  onFile,
  variant = "compact",
}: AdminImageDropFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const busy = disabled || converting;

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (busy) return;
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (busy) return;
    const file = imageFromDataTransfer(event.dataTransfer);
    if (file) onFile(file);
  }

  function openPicker() {
    if (busy) return;
    inputRef.current?.click();
  }

  const panelClass =
    variant === "empty"
      ? `flex aspect-[21/9] w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 text-center transition ${
          dragOver
            ? "border-[#FF3D00]/55 bg-[#FF3D00]/10"
            : "border-white/20 bg-white/[0.04] hover:border-white/30"
        }`
      : `flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed px-3 py-4 text-center transition ${
          dragOver
            ? "border-[#FF3D00]/55 bg-[#FF3D00]/08"
            : "border-white/15 bg-white/[0.03] hover:border-white/25"
        }`;

  return (
    <div
      role="button"
      tabIndex={busy ? -1 : 0}
      onKeyDown={(event) => {
        if (busy) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      onClick={openPicker}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`${panelClass} ${busy ? "pointer-events-none opacity-50" : ""}`}
      aria-disabled={busy}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={busy}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">
        {converting
          ? "Upload R2 en cours…"
          : dragOver
            ? "Déposer l'image ici"
            : variant === "empty"
              ? "Glisser-déposer une photo"
              : "Glisser-déposer ou parcourir"}
      </p>
      <p className="text-[9px] tracking-[0.12em] text-white/35">WebP recommandé · 1 Mo max</p>
    </div>
  );
}
