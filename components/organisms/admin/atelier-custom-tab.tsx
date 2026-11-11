"use client";

import { FormEvent, useEffect, useState } from "react";
import { ATELIER_CUSTOM_SIZES } from "@/lib/atelier-custom-config";
import type { AdminAtelierCustomConfig, AtelierCustomModel } from "@/lib/atelier-custom-config";
import { AtelierModelPreviewTune } from "@/components/molecules/shop/atelier-model-preview-tune";
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-violet-300/80">
          Atelier CUSTOM
        </p>
        <h2 className="text-2xl font-semibold text-white">Modèles personnalisables</h2>
        <p className="text-sm text-white/55">
          Gère les supports du configurateur vitrine (ex. tee blanc #11, tee noir #25).{" "}
          {customized ? "Configuration CRM enregistrée." : "Valeurs par défaut boutique."}
        </p>
      </header>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {formError ? <p className="text-sm text-red-400">{formError}</p> : null}

      <label className="flex items-center gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
          className="size-4 rounded border-white/20"
        />
        Atelier actif sur la boutique
      </label>

      <label className="block space-y-2 text-sm text-white/80">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
          Villes suggérées (séparées par des virgules)
        </span>
        <textarea
          value={citiesText}
          onChange={(e) => setCitiesText(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30"
          placeholder="PARIS, LYON, MARSEILLE"
        />
      </label>

      <div className="space-y-6">
        {draft.models.map((model) => (
          <fieldset
            key={model.id}
            className="dingry-admin-glass space-y-4 rounded-2xl border border-white/8 p-5"
          >
            <legend className="px-1 text-sm font-medium text-white">
              {model.label} <span className="text-white/45">{model.catalogRef}</span>
            </legend>

            <label className="flex items-center gap-3 text-sm text-white/80">
              <input
                type="checkbox"
                checked={model.enabled}
                onChange={(e) => patchModel(model.id, { enabled: e.target.checked })}
                className="size-4 rounded border-white/20"
              />
              Modèle visible dans le configurateur
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm text-white/75">
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">Libellé</span>
                <input
                  value={model.label}
                  onChange={(e) => patchModel(model.id, { label: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                />
              </label>
              <label className="block space-y-1 text-sm text-white/75">
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">Réf. catalogue</span>
                <input
                  value={model.catalogRef}
                  onChange={(e) => patchModel(model.id, { catalogRef: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                />
              </label>
              <label className="block space-y-1 text-sm text-white/75">
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">ID produit CRM</span>
                <input
                  type="number"
                  min={1}
                  value={model.productId}
                  onChange={(e) => patchModel(model.id, { productId: Number(e.target.value) || model.productId })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                />
              </label>
              <label className="block space-y-1 text-sm text-white/75">
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">Prix de base (€)</span>
                <input
                  type="number"
                  min={0}
                  value={model.basePriceEur}
                  onChange={(e) =>
                    patchModel(model.id, { basePriceEur: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                />
              </label>
            </div>

            <label className="block space-y-1 text-sm text-white/75">
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                Tailles (S, M, L, XL…)
              </span>
              <input
                value={model.sizes.join(", ")}
                onChange={(e) => patchModel(model.id, { sizes: parseSizesInput(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
              />
            </label>

            <label className="block space-y-1 text-sm text-white/75">
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">URL visuel aperçu (optionnel)</span>
              <input
                value={model.previewImageUrl}
                onChange={(e) => patchModel(model.id, { previewImageUrl: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>

            <AtelierModelPreviewTune
              model={model}
              onCityTopChange={(cityTop) => patchModel(model.id, { cityTop })}
              onCityColorChange={(previewCityColor) => patchModel(model.id, { previewCityColor })}
              onCitySizeChange={(citySize) => patchModel(model.id, { citySize })}
            />
          </fieldset>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0f18] disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer l'atelier"}
      </button>
    </form>
  );
}
