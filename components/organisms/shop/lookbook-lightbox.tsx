"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ShopProduct } from "@/lib/catalog";
import { isLookbookVideoUrl } from "@/lib/lookbook-moodboard";
import {
  isDialogBackdropDismissTarget,
  supportsNativeModalDialog,
} from "@/components/molecules/dingry-native-dialog";
import type { LookbookSlide } from "@/components/organisms/shop/lookbook-catalog-strip";
import styles from "./lookbook-catalog-strip.module.css";

type LookbookLightboxProps = {
  open: boolean;
  slide: LookbookSlide | null;
  slides: readonly LookbookSlide[];
  product: ShopProduct | null;
  closeLabel: string;
  viewProductLabel: string;
  prevSlideLabel: string;
  nextSlideLabel: string;
  onClose: () => void;
  onSelectSlide: (slide: LookbookSlide) => void;
  onOpenProduct?: (product: ShopProduct) => void;
};

export function LookbookLightbox({
  open,
  slide,
  slides,
  product,
  closeLabel,
  viewProductLabel,
  prevSlideLabel,
  nextSlideLabel,
  onClose,
  onSelectSlide,
  onOpenProduct,
}: LookbookLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const activeIndex = useMemo(() => {
    if (!slide) return -1;
    return slides.findIndex((entry) => entry.id === slide.id);
  }, [slide, slides]);

  const canNavigate = slides.length > 1 && activeIndex >= 0;

  const goRelative = useCallback(
    (delta: number) => {
      if (!canNavigate) return;
      const nextIndex = (activeIndex + delta + slides.length) % slides.length;
      const nextSlide = slides[nextIndex];
      if (nextSlide) onSelectSlide(nextSlide);
    },
    [activeIndex, canNavigate, onSelectSlide, slides],
  );

  const syncDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || !supportsNativeModalDialog()) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    syncDialog();
  }, [syncDialog]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onDialogClose = () => onClose();
    const onClick = (event: MouseEvent) => {
      if (isDialogBackdropDismissTarget(event.target, dialog)) {
        dialog.close();
      }
    };
    dialog.addEventListener("close", onDialogClose);
    dialog.addEventListener("click", onClick);
    return () => {
      dialog.removeEventListener("close", onDialogClose);
      dialog.removeEventListener("click", onClick);
    };
  }, [onClose]);

  useEffect(() => {
    if (!open || !canNavigate) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goRelative(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goRelative(1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canNavigate, goRelative, open]);

  if (!slide) return null;

  const isVideo = isLookbookVideoUrl(slide.image);

  return (
    <dialog
      ref={dialogRef}
      className={styles.lightbox}
      aria-label={slide.title}
      style={{ overscrollBehavior: "contain" }}
    >
      <div className={styles.lightboxPanel}>
        <button type="button" className={styles.lightboxClose} onClick={onClose} aria-label={closeLabel}>
          <X size={22} strokeWidth={1.5} aria-hidden />
        </button>

        {canNavigate ? (
          <>
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxNavPrev}`}
              onClick={() => goRelative(-1)}
              aria-label={prevSlideLabel}
            >
              <ChevronLeft size={28} strokeWidth={1.25} aria-hidden />
            </button>
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxNavNext}`}
              onClick={() => goRelative(1)}
              aria-label={nextSlideLabel}
            >
              <ChevronRight size={28} strokeWidth={1.25} aria-hidden />
            </button>
          </>
        ) : null}

        <figure className={styles.lightboxFigure}>
          {isVideo ? (
            <video
              key={slide.id}
              className={styles.lightboxMedia}
              src={slide.image}
              controls
              playsInline
              preload="metadata"
              aria-label={slide.title}
            />
          ) : (
            <img
              key={slide.id}
              className={styles.lightboxMedia}
              src={slide.image}
              alt={slide.title}
              decoding="async"
            />
          )}
          <figcaption className={styles.lightboxCaption}>
            <span className={styles.lightboxTitle}>{slide.title}</span>
            {slide.caption && !/^(product:\s*)?\d+$/i.test(slide.caption.trim()) ? (
              <span className={styles.lightboxLegend}>{slide.caption}</span>
            ) : null}
            {canNavigate ? (
              <span className={styles.lightboxCounter} aria-live="polite">
                {activeIndex + 1} / {slides.length}
              </span>
            ) : null}
          </figcaption>
        </figure>
        {product && onOpenProduct ? (
          <button
            type="button"
            className={styles.lightboxProductCta}
            onClick={() => {
              onOpenProduct(product);
              onClose();
            }}
          >
            {viewProductLabel}
          </button>
        ) : null}
      </div>
    </dialog>
  );
}