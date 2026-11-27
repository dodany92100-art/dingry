"use client";

import { useMemo } from "react";
import type { AdminLookbookSlideView } from "@/lib/admin/types";
import { collageSlotForIndex, isLookbookVideoUrl, partitionLookbookMontage } from "@/lib/lookbook-moodboard";
import styles from "./lookbook-site-preview.module.css";

type LookbookSitePreviewProps = {
  slides: readonly AdminLookbookSlideView[];
};

/** Aperçu miniature du moodboard vitrine (ordre boutique). */
export function LookbookSitePreview({ slides }: LookbookSitePreviewProps) {
  const ordered = useMemo(
    () => [...slides].filter((slide) => slide.imageUrl.trim()).sort((a, b) => a.sortOrder - b.sortOrder),
    [slides],
  );

  const montageRows = useMemo(
    () => ordered.map((slide) => ({ ...slide, image: slide.imageUrl })),
    [ordered],
  );

  const { phoneSlide, collageSlides: collage } = partitionLookbookMontage(montageRows);

  if (!phoneSlide && collage.length === 0) {
    return (
      <div className={`${styles.frame} px-4 py-10 text-center text-[11px] text-white/40`}>
        Aperçu boutique — ajoutez un visuel pour prévisualiser le moodboard.
      </div>
    );
  }

  return (
    <div className={styles.frame} aria-label="Aperçu lookbook sur la boutique">
      <header className={styles.header}>
        <p className={styles.brandMark}>DINGRY PARIS</p>
        <p className={styles.titleHeading}>
          <span>LOOKBOOK</span>
          <span className={styles.titleSep} aria-hidden>
            {" "}
            /{" "}
          </span>
          <span>ARCHIVES</span>
        </p>
      </header>
      <div className={styles.stage}>
        {phoneSlide ? (
          <figure className={styles.hero}>
            <span className={styles.heroBadge}>{isLookbookVideoUrl(phoneSlide.imageUrl) ? "Vidéo" : "9:16"}</span>
            {isLookbookVideoUrl(phoneSlide.imageUrl) ? (
              <video
                className={styles.heroMedia}
                src={phoneSlide.imageUrl}
                muted
                playsInline
                loop
                autoPlay
                preload="metadata"
                aria-label={phoneSlide.title}
              />
            ) : (
              <img className={styles.heroMedia} src={phoneSlide.imageUrl} alt="" decoding="async" />
            )}
          </figure>
        ) : null}
        {collage.map((slide, index) => {
          const isVideo = isLookbookVideoUrl(slide.imageUrl);
          const slot = collageSlotForIndex(index, collage.length);
          return (
            <figure
              key={slide.id}
              className={styles.tile}
              data-frame={slot.frame}
              style={{
                top: slot.top,
                left: slot.left,
                width: slot.width,
                aspectRatio:
                  slot.aspect === "portrait" ? "3 / 4" : slot.aspect === "square" ? "1 / 1" : "4 / 3",
                zIndex: slot.zIndex,
              }}
            >
              <span className={styles.badge}>{index + (phoneSlide ? 2 : 1)}</span>
              {isVideo ? (
                <video
                  className={styles.tileMedia}
                  src={slide.imageUrl}
                  muted
                  playsInline
                  loop
                  autoPlay
                  preload="metadata"
                  aria-label={slide.title}
                />
              ) : (
                <img className={styles.tileMedia} src={slide.imageUrl} alt="" loading="lazy" decoding="async" />
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}