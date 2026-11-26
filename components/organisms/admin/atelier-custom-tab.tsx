"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminImageDropField } from "@/components/molecules/admin/admin-image-drop-field";
import { AtelierSectionHeroField } from "@/components/molecules/admin/atelier-section-hero-field";
import {
  ATELIER_CUSTOM_SIZES,
  atelierAdminModelPanelStyle,
} from "@/lib/atelier-custom-config";
import type { AdminAtelierCustomConfig, AtelierCustomModel } from "@/lib/atelier-custom-config";
import { AtelierModelPreviewTune } from "@/components/molecules/shop/atelier-model-preview-tune";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import { R2_ATELIER_MODEL_PREVIEW_FOLDER } from "@/lib/client/admin-upload-image";
import {
  ADMIN_CRM_EYEBROW,
  ADMIN_CRM_FIELD,
  ADMIN_CRM_GLASS_PANEL,
  ADMIN_CRM_SUBMIT_BTN,
} from "@/components/organisms/admin/admin-crm-field-styles";
import type { SaveAtelierCustomResult } from "./hooks/use-admin-atelier-custom";
import { useAdminUploadGuard } from "./hooks/use-admin-upload-guard";

type Props = {
  config: AdminAtelierCustomConfig;
  customized: boolean;
  saving: boolean;
  error: string;
  onSave: (config: AdminAtelierCustomConfig) => Promise<SaveAtelierCustomResult>;
};

function parseCities(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((city) => city.trim().toUpperCase())
    .filter((city) => city.length > 0);
}

function parseSizesInput(raw: string): string[] {
  const parsed = raw
    .split(/[,;\s]+/)
    .map((size) => size.trim().toUpperCase())
    .filter((size) => size.length > 0);
  return parsed.length > 0 ? parsed : [...ATELIER_CUSTOM_SIZES];
}

export function AtelierCustomTab({ config, customized, saving, error, onSave }: Props) {
  const [draft, setDraft] = useState(config);
  const [citiesText, setCitiesText] = useState(config.suggestedCities.join(", "));
  const [formError, setFormError] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const [modelPreviewUploadId, setModelPreviewUploadId] = useState<string | null>(null);
  const [modelPreviewError, setModelPreviewError] = useState<{ modelId: string; message: string } | null>(null);
  const busy = saving || heroUploading || modelPreviewUploadId !== null;
  useAdminUploadGuard(busy);

  useEffect(() => {
    setDraft(config);
    setCitiesText(config.suggestedCities.join(", "));
  }, [config]);

  function patchModel(id: string, patch: Partial<AtelierCustomModel>) {
    setDraft((prev) => ({
      ...prev,
      models: prev.models.map((model) => (model.id === id ? { ...model, ...patch } : model)),
    }));
  }

  async function uploadModelPreviewImage(modelId: string, file: File) {
    setModelPreviewError(null);
    setModelPreviewUploadId(modelId);
    const result = await prepareAndUploadAdminImage(file, {
      folder: R2_ATELIER_MODEL_PREVIEW_FOLDER(modelId),
      contentImage: true,
    });
    setModelPreviewUploadId(null);
    if (!result.ok) {
      setModelPreviewError({ modelId, message: result.error });
      return;
    }
    if (result.uploaded?.url) {
      patchModel(modelId, { previewImageUrl: result.uploaded.url });
      return;
    }
    setModelPreviewError({ modelId, message: "Upload R2 requis pour enregistrer le visuel atelier." });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    if (heroUploading || modelPreviewUploadId) {
      setFormError("Attendez la fin de l’upload R2 avant d’enregistrer.");
      return;
    }
    const next: AdminAtelierCustomConfig = {
      ...draft,
      suggestedCities: parseCities(citiesText),
      updatedAt: draft.updatedAt,
    };
    const result = await onSave(next);
    if ("error" in result) setFormError(result.error);
  }

  return (
    <div className="dingry-admin-stock mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Atelier CUSTOM</p>
        <p className="mt-1 text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
          Section atelier (bas de page) + modèles configurateur (tee #11, #25…). Remplace l&apos;ancienne bannière
          catalogue. {customized ? "Configuration CRM enregistrée." : "Valeurs par défaut boutique."}
        </p>
      </div>

      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      {formError ? <p className="mb-3 text-sm text-red-400">{formError}</p> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AtelierSectionHeroField
          value={draft.sectionHero}
          disabled={busy}
          onBusyChange={setHeroUploading}
          onChange={(sectionHero) => setDraft((prev) => ({ ...prev, sectionHero }))}
        />

        <section className={ADMIN_CRM_GLASS_PANEL}>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="size-4 accent-[#FF3D00]"
            />
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/80">
              Atelier actif sur la boutique
            </span>
          </label>

          <label className="mt-5 block">
            <span className={ADMIN_CRM_EYEBROW}>Villes suggérées (virgules)</span>
            <textarea
              value={citiesText}
              onChange={(e) => setCitiesText(e.target.value)}
              rows={2}
              className={`${ADMIN_CRM_FIELD} min-h-[4.5rem] resize-y`}
              placeholder="PARIS, LYON, MARSEILLE"
            />
          </label>
        </section>

        <div className="space-y-5">
          {draft.models.map((model) => (
            <article
              key={model.id}
              className="dingry-admin-glass rounded-2xl p-4 md:p-5"
              style={atelierAdminModelPanelStyle(model.swatch)}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h3 className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-white">
                  <span
                    className="size-4 shrink-0 rounded-full ring-1 ring-white/30"
                    style={{ backgroundColor: model.swatch }}
                    title={`Couleur · ${model.label}`}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    {model.label}{" "}
                    <span className="font-normal text-white/45">{model.catalogRef}</span>
                  </span>
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ring-1 ${
                    model.enabled
                      ? "bg-emerald-500/10 text-emerald-200/90 ring-emerald-400/25"
                      : "bg-white/5 text-white/40 ring-white/15"
                  }`}
                >
                  {model.enabled ? "Visible" : "Masqué"}
                </span>
              </div>

              <label className="mb-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={model.enabled}
                  onChange={(e) => patchModel(model.id, { enabled: e.target.checked })}
                  className="size-4 accent-[#FF3D00]"
                />
                <span className="text-[11px] uppercase tracking-[0.14em] text-white/75">
                  Modèle visible dans le configurateur
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={ADMIN_CRM_EYEBROW}>Libellé</span>
                  <input
                    value={model.label}
                    onChange={(e) => patchModel(model.id, { label: e.target.value })}
                    className={ADMIN_CRM_FIELD}
                  />
                </label>
                <label className="block">
                  <span className={ADMIN_CRM_EYEBROW}>Réf. catalogue</span>
                  <input
                    value={model.catalogRef}
                    onChange={(e) => patchModel(model.id, { catalogRef: e.target.value })}
                    className={ADMIN_CRM_FIELD}
                  />
                </label>
                <label className="block">
                  <span className={ADMIN_CRM_EYEBROW}>ID produit CRM</span>
                  <input
                    type="number"
                    min={1}
                    value={model.productId}
                    onChange={(e) => patchModel(model.id, { productId: Number(e.target.value) || model.productId })}
                    className={ADMIN_CRM_FIELD}
                  />
                </label>
                <label className="block">
                  <span className={ADMIN_CRM_EYEBROW}>Prix de base (€)</span>
                  <input
                    type="number"
                    min={0}
                    value={model.basePriceEur}
                    onChange={(e) =>
                      patchModel(model.id, { basePriceEur: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className={ADMIN_CRM_FIELD}
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className={ADMIN_CRM_EYEBROW}>Tailles (S, M, L, XL…)</span>
                <input
                  value={model.sizes.join(", ")}
                  onChange={(e) => patchModel(model.id, { sizes: parseSizesInput(e.target.value) })}
                  className={ADMIN_CRM_FIELD}
                />
              </label>

              <label className="mt-4 block">
                <span className={ADMIN_CRM_EYEBROW}>Visuel vierge · aperçu configurateur</span>
                <div className="mt-2">
                  <AdminImageDropField
                    variant="compact"
                    disabled={busy}
                    converting={modelPreviewUploadId === model.id}
                    onFile={(file) => void uploadModelPreviewImage(model.id, file)}
                  />
                </div>
                <input
                  value={model.previewImageUrl}
                  onChange={(e) => patchModel(model.id, { previewImageUrl: e.target.value })}
                  className={`${ADMIN_CRM_FIELD} mt-2 text-[13px]`}
                  placeholder="https://… ou glisser-déposer ci-dessus / sur l’aperçu"
                />
              </label>

              <div className="mt-5 flex flex-col items-center border-t border-white/10 pt-5">
                <p className={`${ADMIN_CRM_EYEBROW} w-full max-w-sm`}>Aperçu ville · couleur · taille</p>
                {modelPreviewError?.modelId === model.id ? (
                  <p className="mt-2 w-full max-w-sm text-sm text-red-400">{modelPreviewError.message}</p>
                ) : null}
                <div className="w-full max-w-sm">
                <AtelierModelPreviewTune
                  model={model}
                  uploadDisabled={busy}
                  previewUploading={modelPreviewUploadId === model.id}
                  onPreviewImageFile={(file) => void uploadModelPreviewImage(model.id, file)}
                  onCityTopChange={(cityTop) => patchModel(model.id, { cityTop })}
                  onCityColorChange={(previewCityColor) => patchModel(model.id, { previewCityColor })}
                  onCitySizeChange={(citySize) => patchModel(model.id, { citySize })}
                />
                </div>
              </div>
            </article>
          ))}
        </div>

        <button type="submit" disabled={busy} className={ADMIN_CRM_SUBMIT_BTN}>
          {busy ? "Enregistrement…" : "Enregistrer l'atelier"}
        </button>
      </form>
    </div>
  );
}