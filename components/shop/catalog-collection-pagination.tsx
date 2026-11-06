"use client";

type CatalogCollectionPaginationProps = {
  activeIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

/** 01 / N + flèches — navigation entre blocs catégorie (Collection), pas le lookbook. */
export function CatalogCollectionPagination({
  activeIndex,
  total,
  onPrev,
  onNext,
  className = "",
}: CatalogCollectionPaginationProps) {
  if (total <= 1) return null;

  return (
    <div className={`flex justify-center ${className}`.trim()} aria-label="Navigation collection">
      <div className="flex items-center gap-4 rounded-sm border border-white/25 bg-white/[0.06] px-5 py-2.5 shadow-[0_0_0_1px_rgb(0_102_255/0.12)]">
        <p className="text-sm font-medium tabular-nums tracking-[0.22em] text-white/90" aria-live="polite">
          {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={activeIndex === 0}
            aria-label="Catégorie précédente"
            className="flex h-9 w-9 items-center justify-center border border-white/30 text-sm text-white/90 transition-colors hover:border-[#0066FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={activeIndex >= total - 1}
            aria-label="Catégorie suivante"
            className="flex h-9 w-9 items-center justify-center border border-white/30 text-sm text-white/90 transition-colors hover:border-[#0066FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
