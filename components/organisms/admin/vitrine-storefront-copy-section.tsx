"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CATALOG_FILTERS } from "@/lib/catalog-category";
import {
  DEFAULT_SHOP_STOREFRONT_COPY,
  STOREFRONT_COPY_LIMITS,
  type ShopStorefrontCopyConfig,
} from "@/lib/shop-storefront-copy";
import {
  ADMIN_CRM_GLASS_PANEL,
  ADMIN_CRM_VITRINE_PUBLISH_BTN,
  ADMIN_CRM_VITRINE_RESET_BTN,
} from "@/components/organisms/admin/admin-crm-field-styles";

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
          Mêmes réglages que les crayons sur la vitrine (menu collection, titres de section, bloc Origines,
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