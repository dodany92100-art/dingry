"use client";

import { FormEvent, useEffect, useState } from "react";
import { ATELIER_CUSTOM_SIZES } from "@/lib/atelier-custom-config";
import type { AdminAtelierCustomConfig, AtelierCustomModel } from "@/lib/atelier-custom-config";
import { AtelierModelPreviewTune } from "@/components/molecules/shop/atelier-model-preview-tune";
import {
  ADMIN_CRM_EYEBROW,
  ADMIN_CRM_FIELD,
  ADMIN_CRM_GLASS_PANEL,
  ADMIN_CRM_SUBMIT_BTN,
} from "@/components/organisms/admin/admin-crm-field-styles";
import type { SaveAtelierCustomResult } from "./hooks/use-admin-atelier-custom";

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const next: AdminAtelierCustomConfig = {
      ...draft,
      suggestedCities: parseCities(citiesText),
      updatedAt: draft.updatedAt,
    };
    const result = await onSave(next);
    if ("error" in result) setFormError(result.error);
  }

  return (
    <div className="dingry-admin-stock max-w-3xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Atelier CUSTOM</p>
        <p className="mt-1 text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
          Modèles du configurateur vitrine (tee #11, #25…).{" "}
          {customized ? "Configuration CRM enregistrée." : "Valeurs par défaut boutique."}
        </p>
      </div>

      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      {formError ? <p className="mb-3 text-sm text-red-400">{formError}</p> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
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
            <article key={model.id} className={ADMIN_CRM_GLASS_PANEL}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h3 className="text-sm font-medium text-white">
                  {model.label}{" "}
                  <span className="font-normal text-white/45">{model.catalogRef}</span>
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
                <span className={ADMIN_CRM_EYEBROW}>URL visuel aperçu (optionnel)</span>
                <input
                  value={model.previewImageUrl}
                  onChange={(e) => patchModel(model.id, { previewImageUrl: e.target.value })}
                  className={`${ADMIN_CRM_FIELD} text-[13px]`}
                />
              </label>

              <div className="mt-5 border-t border-white/10 pt-5">
                <p className={ADMIN_CRM_EYEBROW}>Aperçu ville · couleur · taille</p>
                <AtelierModelPreviewTune
                  model={model}
                  onCityTopChange={(cityTop) => patchModel(model.id, { cityTop })}
                  onCityColorChange={(previewCityColor) => patchModel(model.id, { previewCityColor })}
                  onCitySizeChange={(citySize) => patchModel(model.id, { citySize })}
                />
              </div>
            </article>
          ))}
        </div>

        <button type="submit" disabled={saving} className={ADMIN_CRM_SUBMIT_BTN}>
          {saving ? "Enregistrement…" : "Enregistrer l'atelier"}
        </button>
      </form>
    </div>
  );
}