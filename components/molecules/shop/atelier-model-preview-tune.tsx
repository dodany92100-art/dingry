"use client";

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
};

export function AtelierModelPreviewTune({
  model,
  sampleLabel = "MARSEILLE",
  onCityTopChange,
  onCityColorChange,
  onCitySizeChange,
}: AtelierModelPreviewTuneProps) {
  const cityPresentation = resolveAtelierCityTextStyle(model);
  const isFlatTee = model.id === "tee-blanc" || model.id === "tee-noir";

  return (
    <div className="space-y-4">
      <div
        className={`${previewStyles.previewStage} mx-auto max-w-[14rem] ${
          isFlatTee ? previewStyles.previewStageWhite : ""
        }`}
      >
        <img
          src={model.previewImageUrl}
          alt=""
          className={isFlatTee ? previewStyles.previewPhotoWhite : "h-full w-full object-cover"}
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
      <div className="space-y-4">
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