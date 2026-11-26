"use client";

import { useEffect, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { Pencil, X } from "lucide-react";
import { CATALOG_FILTERS } from "@/lib/catalog-category";
import {
  STOREFRONT_COPY_LIMITS,
  type ShopStorefrontCopyConfig,
} from "@/lib/shop-storefront-copy";
import { useShopStorefrontCopy } from "@/hooks/shop-storefront-copy-context";

type PanelMode = "catalog" | "heritage" | "footer";

export const ADMIN_STOREFRONT_PENCIL_BTN_CLASS =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a227]/50 bg-black/70 text-[#c9a227] shadow-[0_0_0_1px_rgb(0_0_0/0.35)] transition-colors hover:border-[#c9a227]/75 hover:bg-black/85";

const MODE_TITLES: Record<PanelMode, string> = {
  catalog: "Titres du menu collection",
  heritage: "Bloc Origines (accueil)",
  footer: "Textes du footer",
};

type AdminStorefrontCopyPanelProps = {
  mode: PanelMode;
  className?: string;
};

export function AdminStorefrontCopyTrigger({
  mode,
  className = "",
  ariaLabel,
}: {
  mode: PanelMode;
  className?: string;
  ariaLabel?: string;
}) {
  const { adminAdjust } = useShopStorefrontCopy();
  const [open, setOpen] = useState(false);
  if (!adminAdjust) return null;
  return (
    <>
      <button
        type="button"
        className={`${ADMIN_STOREFRONT_PENCIL_BTN_CLASS} ${className}`}
        aria-label={ariaLabel ?? `Modifier ${MODE_TITLES[mode]}`}
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
      {open ? <AdminStorefrontCopyPanel mode={mode} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-[9px] tabular-nums text-white/35">
      {value.length}/{max}
    </span>
  );
}

function AdminStorefrontCopyPanel({ mode, onClose }: AdminStorefrontCopyPanelProps & { onClose: () => void }) {
  const { copy, saveCopy, saving } = useShopStorefrontCopy();
  const [draft, setDraft] = useState<ShopStorefrontCopyConfig>(copy);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    setDraft(copy);
  }, [copy]);

  async function publish() {
    setStatus("idle");
    const patch: Partial<ShopStorefrontCopyConfig> =
      mode === "catalog"
        ? { catalog: draft.catalog }
        : mode === "heritage"
          ? { heritagePreview: draft.heritagePreview, heritageDetails: draft.heritageDetails }
          : { footer: draft.footer };
    const ok = await saveCopy(patch);
    setStatus(ok ? "saved" : "error");
    if (ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <StorefrontCopyDialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="storefront-copy-title"
        className="dingry-sale-ui max-h-[min(88vh,640px)] w-full max-w-lg overflow-y-auto rounded-lg border border-[#c9a227]/35 bg-[#0a0a0a] p-4 shadow-2xl sm:p-5"
        onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p id="storefront-copy-title" className="text-[10px] uppercase tracking-[0.2em] text-[#c9a227]">
              {MODE_TITLES[mode]}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/45">
              Limites de caractères pour garder la mise en page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-white/50 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {mode === "catalog" ? (
          <h3 className="grid gap-3">
            {CATALOG_FILTERS.map((filter) => (
              <label key={filter} className="block">
                <span className="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-white/45">
                  {filter}
                  <CharCount value={draft.catalog[filter] ?? ""} max={STOREFRONT_COPY_LIMITS.catalogLabel} />
                </span>
                <input
                  type="text"
                  maxLength={STOREFRONT_COPY_LIMITS.catalogLabel}
                  value={draft.catalog[filter] ?? ""}
                  placeholder={copy.catalog[filter] ?? filter}
                  className="w-full border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      catalog: { ...prev.catalog, [filter]: event.target.value },
                    }))
                  }
                />
              </label>
            ))}
          </h3>
        ) : null}

        {mode === "heritage" ? (
          <div className="grid gap-3">
            {(
              [
                ["titleLine1", "Titre ligne 1", STOREFRONT_COPY_LIMITS.heritageTitleLine],
                ["titleLine2", "Titre ligne 2", STOREFRONT_COPY_LIMITS.heritageTitleLine],
                ["philosophyLead", "Accroche gauche", STOREFRONT_COPY_LIMITS.heritageShort],
                ["philosophyHook", "Texte gauche", STOREFRONT_COPY_LIMITS.heritageBody],
                ["founderKicker", "Surtitre droite", STOREFRONT_COPY_LIMITS.heritageKicker],
                ["founderHook", "Texte droite", STOREFRONT_COPY_LIMITS.heritageBody],
                ["founderOutro", "Fin colonne droite", STOREFRONT_COPY_LIMITS.heritageShort],
                ["homepageHook", "Sous le bloc", STOREFRONT_COPY_LIMITS.heritageBody],
                ["ctaPhilosophy", "Bouton gauche", STOREFRONT_COPY_LIMITS.heritageCta],
                ["ctaFounder", "Bouton droite", STOREFRONT_COPY_LIMITS.heritageCta],
              ] as const
            ).map(([key, label, max]) => (
              <label key={key} className="block">
                <span className="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-white/45">
                  {label}
                  <CharCount value={draft.heritagePreview[key]} max={max} />
                </span>
                {max > 100 ? (
                  <textarea
                    rows={3}
                    maxLength={max}
                    value={draft.heritagePreview[key]}
                    className="w-full resize-y border border-white/15 bg-black/50 px-3 py-2 text-sm leading-relaxed text-white"
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
                    className="w-full border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
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
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-white/40">Cartes détaillées</p>
            {(
              [
                ["philosophy", "Philosophie"],
                ["founder", "Fondateur"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="grid gap-2 rounded border border-white/10 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c9a227]/85">{label}</p>
                <label className="block">
                  <span className="mb-1 flex justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-white/45">
                    Titre
                    <CharCount
                      value={draft.heritageDetails[key].title}
                      max={STOREFRONT_COPY_LIMITS.heritageDetailTitle}
                    />
                  </span>
                  <input
                    type="text"
                    maxLength={STOREFRONT_COPY_LIMITS.heritageDetailTitle}
                    value={draft.heritageDetails[key].title}
                    className="w-full border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        heritageDetails: {
                          ...prev.heritageDetails,
                          [key]: { ...prev.heritageDetails[key], title: event.target.value },
                        },
                      }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1 flex justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-white/45">
                    Texte
                    <CharCount
                      value={draft.heritageDetails[key].body}
                      max={STOREFRONT_COPY_LIMITS.heritageDetailBody}
                    />
                  </span>
                  <textarea
                    rows={4}
                    maxLength={STOREFRONT_COPY_LIMITS.heritageDetailBody}
                    value={draft.heritageDetails[key].body}
                    className="w-full resize-y border border-white/15 bg-black/50 px-3 py-2 text-sm leading-relaxed text-white"
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        heritageDetails: {
                          ...prev.heritageDetails,
                          [key]: { ...prev.heritageDetails[key], body: event.target.value },
                        },
                      }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1 text-[9px] uppercase tracking-[0.14em] text-white/45">URL image</span>
                  <input
                    type="url"
                    maxLength={STOREFRONT_COPY_LIMITS.heritageDetailImageUrl}
                    value={draft.heritageDetails[key].imageUrl}
                    className="w-full border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        heritageDetails: {
                          ...prev.heritageDetails,
                          [key]: { ...prev.heritageDetails[key], imageUrl: event.target.value },
                        },
                      }))
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        ) : null}

        {mode === "footer" ? (
          <div className="grid gap-3">
            {(
              [
                ["manifesto", "Accroche sous le logo", STOREFRONT_COPY_LIMITS.footerManifesto],
                ["brandColumn", "Colonne La marque", STOREFRONT_COPY_LIMITS.footerColumn],
                ["boutiqueColumn", "Colonne Boutique", STOREFRONT_COPY_LIMITS.footerColumn],
                ["legalColumn", "Colonne Légal", STOREFRONT_COPY_LIMITS.footerColumn],
              ] as const
            ).map(([key, label, max]) => (
              <label key={key} className="block">
                <span className="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-white/45">
                  {label}
                  <CharCount value={draft.footer[key]} max={max} />
                </span>
                <input
                  type="text"
                  maxLength={max}
                  value={draft.footer[key]}
                  className="w-full border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
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
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void publish()}
            className="h-10 min-w-28 border border-[#c9a227]/70 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c9a227] disabled:opacity-40"
          >
            {saving ? "Publication…" : "Mettre en ligne"}
          </button>
          {status === "error" ? (
            <span className="text-[10px] uppercase tracking-[0.12em] text-red-400">Échec</span>
          ) : null}
        </div>
      </StorefrontCopyDialog>
    </div>
  );
}

function StorefrontCopyDialog({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}