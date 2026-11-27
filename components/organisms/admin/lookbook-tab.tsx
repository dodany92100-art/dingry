"use client";

import { useMemo, useRef } from "react";
import { GripVertical, Upload } from "lucide-react";
import type { AdminLookbookSlideView } from "@/lib/admin/types";
import { LOOKBOOK_BATCH_UPLOAD_MAX } from "@/lib/admin/lookbook-limits";
import { AdminReorderSurface } from "@/components/organisms/admin/admin-reorder-surface";
import { LookbookSitePreview } from "@/components/organisms/admin/lookbook-site-preview";

type LookbookTabProps = {
  slides: AdminLookbookSlideView[];
  busySlideId: string | null;
  batchImporting: boolean;
  error: string;
  onNew: () => void;
  onEdit: (slide: AdminLookbookSlideView) => void;
  onDelete: (slide: AdminLookbookSlideView) => void;
  onReorderDrop: (fromIndex: number, toIndex: number) => void;
  onImportBatch: (files: File[]) => void;
};

export function LookbookTab({
  slides,
  busySlideId,
  batchImporting,
  error,
  onNew,
  onEdit,
  onDelete,
  onReorderDrop,
  onImportBatch,
}: LookbookTabProps) {
  const batchInputRef = useRef<HTMLInputElement>(null);
  const ordered = useMemo(
    () => [...slides].sort((a, b) => a.sortOrder - b.sortOrder),
    [slides],
  );

  const busy = batchImporting || Boolean(busySlideId);
  const hasSeedOnly = ordered.length > 0 && ordered.every((slide) => slide.source === "seed");
  const reorderEnabled = ordered.length > 1 && !hasSeedOnly && !busy;

  const handleDrop = (fromIndex: number, toIndex: number) => {
    if (!reorderEnabled) return;
    onReorderDrop(fromIndex, toIndex);
  };

  const handleBatchPick = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = [...fileList];
    onImportBatch(files);
    if (batchInputRef.current) batchInputRef.current.value = "";
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Lookbook boutique</p>
          <p className="mt-1 max-w-md text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
            Importez jusqu&apos;à {LOOKBOOK_BATCH_UPLOAD_MAX} visuels en une fois (JPG/PNG → WebP · 8 Mo max) · ordre =
            moodboard vitrine (1 = cadre mobile). Glissez pour réordonner · aperçu site à droite.
          </p>
          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
            {ordered.length} visuel{ordered.length > 1 ? "s" : ""} en ligne
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 self-end sm:flex-row sm:self-auto">
          <button
            type="button"
            disabled={busy}
            onClick={() => batchInputRef.current?.click()}
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#c9a86a]/45 px-4 text-[11px] uppercase tracking-[0.14em] text-[#e8d5a3] transition hover:border-[#c9a86a]/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 max-sm:w-full"
          >
            <Upload size={14} strokeWidth={1.75} aria-hidden />
            {batchImporting ? "Import…" : `Importer en lot (${LOOKBOOK_BATCH_UPLOAD_MAX} max)`}
          </button>
          <input
            ref={batchInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(event) => handleBatchPick(event.target.files)}
          />
          <button
            type="button"
            onClick={onNew}
            disabled={busy}
            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full border border-white/15 px-4 text-[11px] uppercase tracking-[0.14em] text-white/70 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 max-sm:w-full"
          >
            Un visuel (fiche)
          </button>
        </div>
      </div>

      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] xl:items-start">
        <div className="dingry-admin-stock border border-white/10">
          {ordered.length === 0 ? (
            <p className="px-4 py-10 text-sm text-white/40">Aucun visuel.</p>
          ) : (
            ordered.map((slide, index) => {
              const isSeed = slide.source === "seed";
              const row = (
                <div className="flex items-center gap-3 px-3 py-3 md:gap-4 md:px-4">
                  <div
                    className="flex shrink-0 items-center gap-1 text-white/35"
                    data-admin-no-reorder
                    aria-hidden={!reorderEnabled}
                  >
                    <GripVertical size={16} strokeWidth={1.5} />
                    <span className="w-5 text-center text-[10px] font-semibold tabular-nums text-[#c9a86a]">
                      {index + 1}
                    </span>
                  </div>
                  <img
                    src={slide.imageUrl}
                    alt=""
                    className="h-16 w-12 shrink-0 object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] uppercase tracking-[0.22em] text-white">{slide.title}</p>
                    {slide.caption ? (
                      <p className="mt-1 truncate text-[10px] uppercase tracking-[0.16em] text-white/45">
                        {slide.caption}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[9px] tracking-[0.12em] text-white/25">
                      {index === 0 ? "Vitrine · cadre vidéo (si .mp4) ou 1ʳᵉ photo" : "Vitrine · montage"}
                      {isSeed ? " · défaut code" : " · CRM"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center" data-admin-no-reorder>
                    <button
                      type="button"
                      disabled={isSeed}
                      onClick={() => onEdit(slide)}
                      className="h-9 border border-white/15 px-3 text-[10px] uppercase tracking-[0.16em] text-white/60 hover:text-white disabled:opacity-35"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      disabled={busySlideId === slide.id || isSeed}
                      onClick={() => onDelete(slide)}
                      className="h-9 border border-red-500/35 px-3 text-[10px] uppercase tracking-[0.16em] text-red-400/90 hover:text-red-300 disabled:opacity-40"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );

              if (!reorderEnabled) {
                return (
                  <div key={slide.id} className="border-b border-white/[0.06] last:border-b-0">
                    {row}
                  </div>
                );
              }

              return (
                <AdminReorderSurface
                  key={slide.id}
                  dragIndex={index}
                  busy={busy}
                  onDrop={handleDrop}
                  className="border-b border-white/[0.06] last:border-b-0"
                >
                  {row}
                </AdminReorderSurface>
              );
            })
          )}
        </div>

        <aside className="xl:sticky xl:top-24">
          <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/40">Vue site</p>
          <LookbookSitePreview slides={ordered} />
        </aside>
      </div>
    </div>
  );
}