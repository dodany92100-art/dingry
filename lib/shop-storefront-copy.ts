import { CATALOG_FILTER_LABEL, type CatalogCategory, type CatalogFilter } from "@/lib/catalog-category";
import {
  DINGRY_HERITAGE_HOMEPAGE_HOOK,
  DINGRY_ORIGINES_PREVIEW_FOUNDER_HOOK,
  DINGRY_ORIGINES_PREVIEW_FOUNDER_KICKER,
  DINGRY_ORIGINES_PREVIEW_FOUNDER_OUTRO,
  DINGRY_ORIGINES_PREVIEW_PHILOSOPHY_HOOK,
  DINGRY_ORIGINES_PREVIEW_PHILOSOPHY_LEAD,
} from "@/lib/dingry-heritage-content";

export const STOREFRONT_COPY_LIMITS = {
  catalogLabel: 28,
  heritageTitleLine: 26,
  heritageShort: 90,
  heritageBody: 220,
  heritageKicker: 40,
  footerManifesto: 40,
  footerColumn: 22,
  heritageCta: 32,
} as const;

export type ShopStorefrontCatalogCopy = Partial<Record<CatalogFilter, string>>;

export type ShopStorefrontHeritagePreviewCopy = {
  titleLine1: string;
  titleLine2: string;
  philosophyLead: string;
  philosophyHook: string;
  founderKicker: string;
  founderHook: string;
  founderOutro: string;
  homepageHook: string;
  ctaPhilosophy: string;
  ctaFounder: string;
};

export type ShopStorefrontFooterCopy = {
  manifesto: string;
  brandColumn: string;
  boutiqueColumn: string;
  legalColumn: string;
};

export type ShopStorefrontCopyConfig = {
  catalog: ShopStorefrontCatalogCopy;
  heritagePreview: ShopStorefrontHeritagePreviewCopy;
  footer: ShopStorefrontFooterCopy;
};

export const DEFAULT_SHOP_STOREFRONT_HERITAGE_PREVIEW: ShopStorefrontHeritagePreviewCopy = {
  titleLine1: "LE LUXE EST DANS",
  titleLine2: "L'ATTITUDE",
  philosophyLead: DINGRY_ORIGINES_PREVIEW_PHILOSOPHY_LEAD,
  philosophyHook: DINGRY_ORIGINES_PREVIEW_PHILOSOPHY_HOOK,
  founderKicker: DINGRY_ORIGINES_PREVIEW_FOUNDER_KICKER,
  founderHook: DINGRY_ORIGINES_PREVIEW_FOUNDER_HOOK,
  founderOutro: DINGRY_ORIGINES_PREVIEW_FOUNDER_OUTRO,
  homepageHook: DINGRY_HERITAGE_HOMEPAGE_HOOK,
  ctaPhilosophy: "Découvrir l'univers",
  ctaFounder: "Découvrir son histoire",
};

export const DEFAULT_SHOP_STOREFRONT_FOOTER: ShopStorefrontFooterCopy = {
  manifesto: "LE LUXE EST DANS L'ATTITUDE",
  brandColumn: "La marque",
  boutiqueColumn: "Boutique",
  legalColumn: "Légal",
};

export const DEFAULT_SHOP_STOREFRONT_COPY: ShopStorefrontCopyConfig = {
  catalog: {},
  heritagePreview: DEFAULT_SHOP_STOREFRONT_HERITAGE_PREVIEW,
  footer: DEFAULT_SHOP_STOREFRONT_FOOTER,
};

function clampText(value: unknown, max: number, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return fallback;
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd();
}

function normalizeCatalogCopy(input: unknown): ShopStorefrontCatalogCopy {
  if (!input || typeof input !== "object") return {};
  const record = input as Record<string, unknown>;
  const out: ShopStorefrontCatalogCopy = {};
  for (const key of Object.keys(CATALOG_FILTER_LABEL) as CatalogFilter[]) {
    const raw = record[key];
    if (typeof raw !== "string" || !raw.trim()) continue;
    out[key] = clampText(raw, STOREFRONT_COPY_LIMITS.catalogLabel, CATALOG_FILTER_LABEL[key]);
  }
  return out;
}

export function normalizeShopStorefrontCopy(input: unknown): ShopStorefrontCopyConfig {
  const base = DEFAULT_SHOP_STOREFRONT_COPY;
  if (!input || typeof input !== "object") return { ...base, catalog: {}, heritagePreview: { ...base.heritagePreview }, footer: { ...base.footer } };
  const record = input as Record<string, unknown>;
  const heritageRaw = record.heritagePreview;
  const footerRaw = record.footer;
  const heritageDefaults = DEFAULT_SHOP_STOREFRONT_HERITAGE_PREVIEW;
  const footerDefaults = DEFAULT_SHOP_STOREFRONT_FOOTER;
  const heritageRecord =
    heritageRaw && typeof heritageRaw === "object" ? (heritageRaw as Record<string, unknown>) : {};
  const footerRecord = footerRaw && typeof footerRaw === "object" ? (footerRaw as Record<string, unknown>) : {};

  return {
    catalog: normalizeCatalogCopy(record.catalog),
    heritagePreview: {
      titleLine1: clampText(
        heritageRecord.titleLine1,
        STOREFRONT_COPY_LIMITS.heritageTitleLine,
        heritageDefaults.titleLine1,
      ),
      titleLine2: clampText(
        heritageRecord.titleLine2,
        STOREFRONT_COPY_LIMITS.heritageTitleLine,
        heritageDefaults.titleLine2,
      ),
      philosophyLead: clampText(
        heritageRecord.philosophyLead,
        STOREFRONT_COPY_LIMITS.heritageShort,
        heritageDefaults.philosophyLead,
      ),
      philosophyHook: clampText(
        heritageRecord.philosophyHook,
        STOREFRONT_COPY_LIMITS.heritageBody,
        heritageDefaults.philosophyHook,
      ),
      founderKicker: clampText(
        heritageRecord.founderKicker,
        STOREFRONT_COPY_LIMITS.heritageKicker,
        heritageDefaults.founderKicker,
      ),
      founderHook: clampText(
        heritageRecord.founderHook,
        STOREFRONT_COPY_LIMITS.heritageBody,
        heritageDefaults.founderHook,
      ),
      founderOutro: clampText(
        heritageRecord.founderOutro,
        STOREFRONT_COPY_LIMITS.heritageShort,
        heritageDefaults.founderOutro,
      ),
      homepageHook: clampText(
        heritageRecord.homepageHook,
        STOREFRONT_COPY_LIMITS.heritageBody,
        heritageDefaults.homepageHook,
      ),
      ctaPhilosophy: clampText(
        heritageRecord.ctaPhilosophy,
        STOREFRONT_COPY_LIMITS.heritageCta,
        heritageDefaults.ctaPhilosophy,
      ),
      ctaFounder: clampText(
        heritageRecord.ctaFounder,
        STOREFRONT_COPY_LIMITS.heritageCta,
        heritageDefaults.ctaFounder,
      ),
    },
    footer: {
      manifesto: clampText(
        footerRecord.manifesto,
        STOREFRONT_COPY_LIMITS.footerManifesto,
        footerDefaults.manifesto,
      ),
      brandColumn: clampText(
        footerRecord.brandColumn,
        STOREFRONT_COPY_LIMITS.footerColumn,
        footerDefaults.brandColumn,
      ),
      boutiqueColumn: clampText(
        footerRecord.boutiqueColumn,
        STOREFRONT_COPY_LIMITS.footerColumn,
        footerDefaults.boutiqueColumn,
      ),
      legalColumn: clampText(
        footerRecord.legalColumn,
        STOREFRONT_COPY_LIMITS.footerColumn,
        footerDefaults.legalColumn,
      ),
    },
  };
}

export function mergeShopStorefrontCopyPatch(
  current: ShopStorefrontCopyConfig,
  patch: unknown,
): ShopStorefrontCopyConfig {
  if (!patch || typeof patch !== "object") return normalizeShopStorefrontCopy(current);
  const record = patch as Record<string, unknown>;
  const nextCatalog = { ...current.catalog };
  if (record.catalog && typeof record.catalog === "object") {
    const catalogPatch = record.catalog as Record<string, unknown>;
    for (const key of Object.keys(catalogPatch) as CatalogFilter[]) {
      const raw = catalogPatch[key];
      if (typeof raw === "string" && raw.trim()) {
        nextCatalog[key] = clampText(raw, STOREFRONT_COPY_LIMITS.catalogLabel, CATALOG_FILTER_LABEL[key]);
      } else if (raw === "" || raw === null) {
        delete nextCatalog[key];
      }
    }
  }
  return normalizeShopStorefrontCopy({
    catalog: nextCatalog,
    heritagePreview: {
      ...current.heritagePreview,
      ...(record.heritagePreview && typeof record.heritagePreview === "object"
        ? record.heritagePreview
        : {}),
    },
    footer: {
      ...current.footer,
      ...(record.footer && typeof record.footer === "object" ? record.footer : {}),
    },
  });
}

export function defaultCatalogLabelForCategory(
  category: CatalogCategory,
  localeLabel: (filter: CatalogFilter) => string,
): string {
  return localeLabel(category);
}