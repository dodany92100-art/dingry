"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CATALOG_FILTERS } from "@/lib/catalog-category";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import { R2_VITRINE_HERITAGE_DETAIL_FOLDER } from "@/lib/client/admin-upload-image";
import {
  DEFAULT_SHOP_STOREFRONT_COPY,
  STOREFRONT_COPY_LIMITS,
  type ShopStorefrontCopyConfig,
  type ShopStorefrontHeritageDetailBlock,
} from "@/lib/shop-storefront-copy";
import {
  ADMIN_CRM_GLASS_PANEL,
  ADMIN_CRM_VITRINE_PUBLISH_BTN,
  ADMIN_CRM_VITRINE_RESET_BTN,
} from "@/components/organisms/admin/admin-crm-field-styles";
import { useAdminUploadGuard } from "@/components/organisms/admin/hooks/use-admin-upload-guard";

type Props = {
  onUnauthorized: () => void;
  resetVersion?: number;
  onDirtyChange?: (dirty: boolean) => void;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-[9px] tabular-nums text-white/35">
      {value.length}/{max}
    </span>
  );
}

function copySnapshot(config: ShopStorefrontCopyConfig): ShopStorefrontCopyConfig {
  return {
    catalog: { ...config.catalog },
    heritagePreview: { ...config.heritagePreview },
    heritageDetails: {
      philosophy: { ...config.heritageDetails.philosophy },
      founder: { ...config.heritageDetails.founder },
    },
    footer: { ...config.footer },
  };
}

export function VitrineStorefrontCopySection({
  onUnauthorized,
  resetVersion = 0,
  onDirtyChange,
}: Props) {
  const [baseline, setBaseline] = useState<ShopStorefrontCopyConfig>(DEFAULT_SHOP_STOREFRONT_COPY);
  const [draft, setDraft] = useState<ShopStorefrontCopyConfig>(DEFAULT_SHOP_STOREFRONT_COPY);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [uploadingDetail, setUploadingDetail] = useState<"philosophy" | "founder" | null>(null);

  useAdminUploadGuard(uploadingDetail !== null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/shop/storefront-copy", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        if (!response.ok) return;
        const payload = (await response.json()) as { copy?: ShopStorefrontCopyConfig };
        if (!cancelled && payload.copy) {
          const snap = copySnapshot(payload.copy);
          setBaseline(snap);
          setDraft(snap);
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  const dirty =
    loaded &&
    JSON.stringify(draft) !== JSON.stringify(baseline);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty]);

  useEffect(() => {
    if (resetVersion < 1) return;
    setDraft(copySnapshot(baseline));
    setStatus("idle");
  }, [resetVersion, baseline]);

  function discardChanges() {
    setDraft(copySnapshot(baseline));
    setStatus("idle");
  }

  async function resetToFactory() {
    if (status === "saving") return;
    if (
      !window.confirm(
        "Réinitialiser tous les textes boutique (menu, Origines, footer) sur les textes d’origine ?",
      )
    ) {
      return;
    }
    const factory = copySnapshot(DEFAULT_SHOP_STOREFRONT_COPY);
    setStatus("saving");
    try {
      const response = await fetch("/api/admin/shop/storefront-copy", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(factory),
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (!response.ok) {
        setStatus("error");
        return;
      }
      const payload = (await response.json()) as { copy?: ShopStorefrontCopyConfig };
      if (payload.copy) {
        const snap = copySnapshot(payload.copy);
        setBaseline(snap);
        setDraft(snap);
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function patchHeritageDetail(
    block: "philosophy" | "founder",
    patch: Partial<ShopStorefrontHeritageDetailBlock>,
  ) {
    setDraft((prev) => ({
      ...prev,
      heritageDetails: {
        ...prev.heritageDetails,
        [block]: { ...prev.heritageDetails[block], ...patch },
      },
    }));
  }

  async function uploadHeritageDetailImage(block: "philosophy" | "founder", file: File) {
    setUploadingDetail(block);
    const result = await prepareAndUploadAdminImage(file, {
      folder: R2_VITRINE_HERITAGE_DETAIL_FOLDER,
      contentImage: true,
    });
    setUploadingDetail(null);
    if (!result.ok) return;
    const url = result.uploaded?.url?.trim() ?? "";
    if (url) patchHeritageDetail(block, { imageUrl: url });
  }

  async function publish() {
    setStatus("saving");
    try {
      const response = await fetch("/api/admin/shop/storefront-copy", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (!response.ok) {
        setStatus("error");
        return;
      }
      const payload = (await response.json()) as { copy?: ShopStorefrontCopyConfig };
      if (payload.copy) {
        const snap = copySnapshot(payload.copy);
        setBaseline(snap);
        setDraft(snap);
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  if (!loaded) {
    return <p className="text-sm text-white/40">Chargement des textes…</p>;
  }

  return (
    <section className={`${ADMIN_CRM_GLASS_PANEL} space-y-8`}>
      <header className="border-b border-white/[0.08] pb-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/70">Textes boutique</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
          Mêmes réglages que les crayons sur la vitrine (menu collection, bloc Origines, cartes détaillées,
          footer). Les compteurs évitent de casser la mise en page.
        </p>
      </header>

      <div className="space-y-4">
        <h4 className="text-[10px] uppercase tracking-[0.18em] text-white/45">Menu collection</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG_FILTERS.map((filter) => (
            <label key={filter} className="block">
              <span className="mb-1 flex justify-between gap-2 text-[9px] uppercase tracking-[0.12em] text-white/40">
                {filter}
                <CharCount value={draft.catalog[filter] ?? ""} max={STOREFRONT_COPY_LIMITS.catalogLabel} />
              </span>
              <input
                type="text"
                maxLength={STOREFRONT_COPY_LIMITS.catalogLabel}
                value={draft.catalog[filter] ?? ""}
                className="w-full rounded border border-white/12 bg-black/40 px-3 py-2 text-sm text-white"
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    catalog: { ...prev.catalog, [filter]: event.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] uppercase tracking-[0.18em] text-white/45">Bloc Origines (aperçu)</h4>
        <CopyFieldsGrid className="grid gap-3 lg:grid-cols-2">
          {(
            [
              ["titleLine1", "Titre ligne 1", STOREFRONT_COPY_LIMITS.heritageTitleLine, false],
              ["titleLine2", "Titre ligne 2", STOREFRONT_COPY_LIMITS.heritageTitleLine, false],
              ["philosophyLead", "Accroche gauche", STOREFRONT_COPY_LIMITS.heritageShort, false],
              ["philosophyHook", "Texte gauche", STOREFRONT_COPY_LIMITS.heritageBody, true],
              ["founderKicker", "Surtitre droite", STOREFRONT_COPY_LIMITS.heritageKicker, false],
              ["founderHook", "Texte droite", STOREFRONT_COPY_LIMITS.heritageBody, true],
              ["founderOutro", "Fin colonne droite", STOREFRONT_COPY_LIMITS.heritageShort, false],
              ["homepageHook", "Sous le bloc", STOREFRONT_COPY_LIMITS.heritageBody, true],
              ["ctaPhilosophy", "Bouton gauche", STOREFRONT_COPY_LIMITS.heritageCta, false],
              ["ctaFounder", "Bouton droite", STOREFRONT_COPY_LIMITS.heritageCta, false],
            ] as const
          ).map(([key, label, max, multiline]) => (
            <label key={key} className="block">
              <span className="mb-1 flex justify-between gap-2 text-[9px] uppercase tracking-[0.12em] text-white/40">
                {label}
                <CharCount value={draft.heritagePreview[key]} max={max} />
              </span>
              {multiline ? (
                <textarea
                  rows={3}
                  maxLength={max}
                  value={draft.heritagePreview[key]}
                  className="w-full resize-y rounded border border-white/12 bg-black/40 px-3 py-2 text-sm text-white"
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      heritagePreview: { ...prev.heritagePreview, [key]: event.target.value },
                    }))
                  }
                />
              ) : (
                <input
                  type="text"
                  maxLength={max}
                  value={draft.heritagePreview[key]}
                  className="w-full rounded border border-white/12 bg-black/40 px-3 py-2 text-sm text-white"
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      heritagePreview: { ...prev.heritagePreview, [key]: event.target.value },
                    }))
                  }
                />
              )}
            </label>
          ))}
        </CopyFieldsGrid>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] uppercase tracking-[0.18em] text-white/45">
          Origines · cartes détaillées (après « Découvrir son histoire »)
        </h4>
        <p className="max-w-2xl text-xs leading-relaxed text-white/45">
          Titres, textes longs et visuels des deux cartes. Format portrait conseillé (3:4).
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          <HeritageDetailBlockEditor
            label="Philosophie · luxe & attitude"
            block={draft.heritageDetails.philosophy}
            uploading={uploadingDetail === "philosophy"}
            onChange={(patch) => patchHeritageDetail("philosophy", patch)}
            onFile={(file) => void uploadHeritageDetailImage("philosophy", file)}
          />
          <HeritageDetailBlockEditor
            label="Fondateur · Sully Sefil"
            block={draft.heritageDetails.founder}
            uploading={uploadingDetail === "founder"}
            onChange={(patch) => patchHeritageDetail("founder", patch)}
            onFile={(file) => void uploadHeritageDetailImage("founder", file)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] uppercase tracking-[0.18em] text-white/45">Footer</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["manifesto", "Accroche logo", STOREFRONT_COPY_LIMITS.footerManifesto],
              ["brandColumn", "Colonne marque", STOREFRONT_COPY_LIMITS.footerColumn],
              ["boutiqueColumn", "Colonne boutique", STOREFRONT_COPY_LIMITS.footerColumn],
              ["legalColumn", "Colonne légal", STOREFRONT_COPY_LIMITS.footerColumn],
            ] as const
          ).map(([key, label, max]) => (
            <label key={key} className="block">
              <span className="mb-1 flex justify-between gap-2 text-[9px] uppercase tracking-[0.12em] text-white/40">
                {label}
                <CharCount value={draft.footer[key]} max={max} />
              </span>
              <input
                type="text"
                maxLength={max}
                value={draft.footer[key]}
                className="w-full rounded border border-white/12 bg-black/40 px-3 py-2 text-sm text-white"
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, [key]: event.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={status === "saving"}
          onClick={() => void resetToFactory()}
          className={ADMIN_CRM_VITRINE_RESET_BTN}
        >
          Réinitialiser
        </button>
        <button
          type="button"
          disabled={!dirty || status === "saving"}
          onClick={discardChanges}
          className="h-10 rounded-full border border-white/20 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65 transition hover:border-white/35 hover:text-white disabled:opacity-35"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!dirty || status === "saving"}
          onClick={() => void publish()}
          className={ADMIN_CRM_VITRINE_PUBLISH_BTN}
        >
          <span className="gold-text">{status === "saving" ? "Publication…" : "Mettre en ligne"}</span>
        </button>
        {status === "saved" ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-emerald-400/90">Vitrine à jour</span>
        ) : null}
        {status === "error" ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-red-400/90">Échec — réessaie</span>
        ) : null}
      </div>
    </section>
  );
}

function CopyFieldsGrid({ className = "", children }: { className?: string; children?: ReactNode }) {
  return <div className={className}>{children}</div>;
}

type HeritageDetailBlockEditorProps = {
  label: string;
  block: ShopStorefrontHeritageDetailBlock;
  uploading: boolean;
  onChange: (patch: Partial<ShopStorefrontHeritageDetailBlock>) => void;
  onFile: (file: File) => void;
};

function HeritageDetailBlockEditor({
  label,
  block,
  uploading,
  onChange,
  onFile,
}: HeritageDetailBlockEditorProps) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c9a227]/90">{label}</p>
      <label className="block">
        <span className="mb-1 flex justify-between gap-2 text-[9px] uppercase tracking-[0.12em] text-white/40">
          Titre
          <CharCount value={block.title} max={STOREFRONT_COPY_LIMITS.heritageDetailTitle} />
        </span>
        <input
          type="text"
          maxLength={STOREFRONT_COPY_LIMITS.heritageDetailTitle}
          value={block.title}
          className="w-full rounded border border-white/12 bg-black/40 px-3 py-2 text-sm text-white"
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between gap-2 text-[9px] uppercase tracking-[0.12em] text-white/40">
          Texte
          <CharCount value={block.body} max={STOREFRONT_COPY_LIMITS.heritageDetailBody} />
        </span>
        <textarea
          rows={6}
          maxLength={STOREFRONT_COPY_LIMITS.heritageDetailBody}
          value={block.body}
          className="w-full resize-y rounded border border-white/12 bg-black/40 px-3 py-2 text-sm leading-relaxed text-white"
          onChange={(event) => onChange({ body: event.target.value })}
        />
      </label>
      <div className="space-y-2">
        <span className="block text-[9px] uppercase tracking-[0.12em] text-white/40">Photo</span>
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
          {block.imageUrl.trim() ? (
            <img
              src={block.imageUrl}
              alt=""
              className="mx-auto block max-h-48 w-full object-contain"
            />
          ) : (
            <p className="px-3 py-8 text-center text-[10px] uppercase tracking-[0.12em] text-white/35">
              Aucune image
            </p>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-white/35 hover:text-white">
          {uploading ? "Envoi…" : "Choisir une image"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onFile(file);
            }}
          />
        </label>
      </div>
    </div>
  );
}