"use client";

import { useState, type DragEvent } from "react";
import { resolveAtelierCityTextStyle, type AtelierCustomModel } from "@/lib/atelier-custom-config";
import { AtelierCityColorControl } from "@/components/molecules/shop/atelier-city-color-control";
import { AtelierCitySizeSlider } from "@/components/molecules/shop/atelier-city-size-slider";
import { AtelierCityTopSlider } from "@/components/molecules/shop/atelier-city-top-slider";
import previewStyles from "@/components/organisms/shop/personalize-modal.module.css";

type AtelierModelPreviewTuneProps = {
  model: AtelierCustomModel;
  sampleLabel?: string;
  onCityTopChange: (cityTop: string) => void;
  onCityColorChange: (color: string) => void;
  onCitySizeChange: (citySize: string) => void;
  /** Admin : glisser-déposer un visuel vierge sur l’aperçu. */
  onPreviewImageFile?: (file: File) => void;
  previewUploading?: boolean;
  uploadDisabled?: boolean;
};

function imageFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const file = dataTransfer.files?.[0];
  if (!file || !file.type.startsWith("image/")) return null;
  return file;
}

export function AtelierModelPreviewTune({
  model,
  sampleLabel = "MARSEILLE",
  onCityTopChange,
  onCityColorChange,
  onCitySizeChange,
  onPreviewImageFile,
  previewUploading = false,
  uploadDisabled = false,
}: AtelierModelPreviewTuneProps) {
  const [dragOver, setDragOver] = useState(false);
  const cityPresentation = resolveAtelierCityTextStyle(model);
  const isFlatTee = model.id === "tee-blanc" || model.id === "tee-noir";
  const dropEnabled = Boolean(onPreviewImageFile) && !uploadDisabled && !previewUploading;

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!dropEnabled) return;
    setDragOver(true);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (!dropEnabled || !onPreviewImageFile) return;
    const file = imageFromDataTransfer(event.dataTransfer);
    if (file) onPreviewImageFile(file);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-4">
      {onPreviewImageFile ? (
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
          Visuel vierge · glisser-déposer sur l&apos;aperçu (WebP · 1 Mo max)
        </p>
      ) : null}
      <div
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative w-full max-w-[14rem] ${dropEnabled && dragOver ? "ring-2 ring-[#FF3D00]/50 ring-offset-2 ring-offset-[#070b14]" : ""}`}
      >
        <div
          className={`${previewStyles.previewStage} ${
            isFlatTee ? previewStyles.previewStageWhite : ""
          }`}
        >
          <img
            src={model.previewImageUrl}
            alt=""
            className={isFlatTee ? previewStyles.previewPhotoWhite : "h-full w-full object-cover"}
            draggable={false}
          />
          <div
            className={`${previewStyles.previewCityOverlay} ${cityPresentation.className} pointer-events-none left-1/2 -translate-x-1/2 text-center uppercase`}
            style={{
              top: model.cityTop,
              width: "78%",
              fontSize: model.citySize,
              ...cityPresentation.style,
            }}
            aria-hidden
          >
            {sampleLabel}
          </div>
        </div>
        {previewUploading ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-black/60 text-[9px] font-medium uppercase tracking-[0.2em] text-amber-200/95">
            Upload R2…
          </span>
        ) : null}
        {dropEnabled && dragOver ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-black/55 text-[9px] font-medium uppercase tracking-[0.18em] text-white">
            Déposer le visuel
          </span>
        ) : null}
      </div>
      <div className="w-full space-y-4">
        <AtelierCityColorControl
          id={`atelier-city-color-${model.id}`}
          value={model.previewCityColor}
          onChange={onCityColorChange}
          modelId={model.id}
          tone="dark"
        />
        <AtelierCitySizeSlider
          id={`atelier-city-size-${model.id}`}
          citySize={model.citySize}
          onChange={onCitySizeChange}
          tone="dark"
        />
        <AtelierCityTopSlider
          id={`atelier-city-top-${model.id}`}
          value={model.cityTop}
          onChange={onCityTopChange}
          tone="dark"
        />
      </div>
    </div>
  );
}