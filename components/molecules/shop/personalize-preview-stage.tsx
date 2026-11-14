"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import type { AtelierCustomModel } from "@/lib/atelier-custom-config";
import { deliveryImageUrl } from "@/lib/media/delivery-image-url";
import styles from "./personalize-preview-stage.module.css";

export type PersonalizePreviewStageProps = {
  model: AtelierCustomModel;
  imageUrl: string;
  previewLabel: string;
  previewCityTop: string;
  previewCitySize: string;
  cityClassName: string;
  cityStyle: CSSProperties;
  sideLabel?: string;
  showCityOverlay?: boolean;
  onOpenZoom?: () => void;
  rootClassName?: string;
};

function isFlatAtelierTee(modelId: string): boolean {
  return modelId === "tee-blanc" || modelId === "tee-noir";
}

export function PersonalizePreviewStage({
  model,
  imageUrl,
  previewLabel,
  previewCityTop,
  previewCitySize,
  cityClassName,
  cityStyle,
  sideLabel = "Vue recto — sous le logo",
  showCityOverlay = true,
  onOpenZoom,
  rootClassName = "",
}: PersonalizePreviewStageProps) {
  const flatTee = isFlatAtelierTee(model.id);
  const safeImageUrl = deliveryImageUrl(imageUrl);

  const openFromStage = () => {
    onOpenZoom?.();
  };

  const onStageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onOpenZoom) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenZoom();
    }
  };

  const onExpandClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onOpenZoom?.();
  };

  return (
    <div
      className={`${styles.stage} ${flatTee ? styles.stageFlatTee : ""} ${onOpenZoom ? styles.stageZoomable : ""} ${rootClassName}`.trim()}
      role={onOpenZoom ? "button" : undefined}
      tabIndex={onOpenZoom ? 0 : undefined}
      onClick={onOpenZoom ? openFromStage : undefined}
      onKeyDown={onOpenZoom ? onStageKeyDown : undefined}
      aria-label={onOpenZoom ? "Agrandir l’aperçu du t-shirt" : undefined}
      data-flat-tee={flatTee ? "true" : undefined}
    >
      {onOpenZoom ? (
        <button type="button" className={styles.expandBtn} onClick={onExpandClick} aria-label="Agrandir l’aperçu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      ) : null}
      {flatTee ? (
        <img src={safeImageUrl} alt="" aria-hidden className={styles.backdrop} />
      ) : null}
      <img
        src={safeImageUrl}
        alt={`${model.label} — ${sideLabel.toLowerCase().includes("verso") ? "vue verso" : "vue recto"}`}
        className={flatTee ? styles.photo : styles.photoCover}
        draggable={false}
      />
      {showCityOverlay && previewLabel ? (
        <div
          className={`${styles.cityOverlay} ${cityClassName} pointer-events-none left-1/2 -translate-x-1/2 text-center uppercase`}
          style={{
            top: previewCityTop,
            width: "78%",
            fontSize: previewCitySize,
            ...cityStyle,
          }}
          aria-live="polite"
        >
          {previewLabel}
        </div>
      ) : null}
      <p className={styles.captionTop}>{sideLabel}</p>
      <p className={styles.captionBottom}>Simulation indicative</p>
    </div>
  );
}
