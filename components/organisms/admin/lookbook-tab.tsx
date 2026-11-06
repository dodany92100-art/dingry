"use client";

import type { AdminLookbookSlide } from "@/lib/admin/types";

type LookbookTabProps = {
  slides: AdminLookbookSlide[];
  busySlideId: string | null;
  error: string;
  onNew: () => void;
  onEdit: (slide: AdminLookbookSlide) => void;
  onReorder: (slide: AdminLookbookSlide, direction: "up" | "down") => void;
};

export function LookbookTab({ slides, busySlideId, error, onNew, onEdit, onReorder }: LookbookTabProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Lookbook boutique</p>
          <p className="mt-1 max-w-md text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
            Slides du carrousel sur la page d&apos;accueil (ordre + visuels WebP).
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="h-9 border border-white/15 px-3 text-[11px] uppercase tracking-[0.18em] text-white/70 hover:text-white"
        >
          Nouvelle slide
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <div className="dingry-admin-stock border border-white/10">
        {slides.length === 0 ? (
          <p className="px-4 py-10 text-sm text-white/40">Aucune slide.</p>
        ) : (
          slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0 md:gap-4 md:px-4"
            >
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
                  <p className="mt-1 truncate text-[10px] uppercase tracking-[0.16em] text-white/45">{slide.caption}</p>
                ) : null}
                <p className="mt-1 text-[9px] tracking-[0.12em] text-white/25">Ordre {slide.sortOrder + 1}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  disabled={busySlideId === slide.id || index === 0}
                  onClick={() => onReorder(slide, "up")}
                  className="h-8 w-8 border border-white/10 text-xs text-white/50 hover:text-white disabled:opacity-30"
                  aria-label="Monter"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={busySlideId === slide.id || index >= slides.length - 1}
                  onClick={() => onReorder(slide, "down")}
                  className="h-8 w-8 border border-white/10 text-xs text-white/50 hover:text-white disabled:opacity-30"
                  aria-label="Descendre"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                onClick={() => onEdit(slide)}
                className="h-9 shrink-0 border border-white/15 px-3 text-[10px] uppercase tracking-[0.16em] text-white/60 hover:text-white"
              >
                Modifier
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
