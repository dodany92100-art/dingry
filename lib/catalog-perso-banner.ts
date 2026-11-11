import type { AdminCatalogPersoBanner, ShopCatalogPersoBanner } from "@/lib/admin/types";
import { DEFAULT_PERSO_BANNER_FOCUS_X, DEFAULT_PERSO_BANNER_FOCUS_Y } from "@/lib/catalog-perso-banner-focus";
import { CUSTOM_BANNER_COPY } from "@/lib/custom-city-banner";

/** Textes formulaire admin — pas d’URL image (uniquement R2 + Supabase). */
export const CATALOG_PERSO_BANNER_COPY: Omit<ShopCatalogPersoBanner, "imageUrl"> = {
  enabled: true,
  imageFocusX: DEFAULT_PERSO_BANNER_FOCUS_X,
  imageFocusY: DEFAULT_PERSO_BANNER_FOCUS_Y,
  cityVisuals: {},
  eyebrow: CUSTOM_BANNER_COPY.eyebrow,
  title: CUSTOM_BANNER_COPY.title,
  subtitle: CUSTOM_BANNER_COPY.subtitle,
  ctaLabel: CUSTOM_BANNER_COPY.cta,
};

/** @deprecated Préférer CATALOG_PERSO_BANNER_COPY ; imageUrl toujours vide hors CRM. */
export const DEFAULT_CATALOG_PERSO_BANNER: ShopCatalogPersoBanner = {
  ...CATALOG_PERSO_BANNER_COPY,
  imageUrl: "",
  cityVisuals: {},
};

function normalizeCatalogPersoCtaLabel(label: string | undefined): string {
  const trimmed = label?.trim() ?? "";
  if (!trimmed) return CATALOG_PERSO_BANNER_COPY.ctaLabel;
  if (trimmed.localeCompare("Personnaliser", undefined, { sensitivity: "accent" }) === 0) {
    return "CUSTOM";
  }
  return trimmed;
}

export function resolveShopCatalogPersoBanner(
  stored: AdminCatalogPersoBanner | null | undefined,
): ShopCatalogPersoBanner {
  if (!stored) return { ...DEFAULT_CATALOG_PERSO_BANNER };
  return {
    enabled: stored.enabled,
    imageUrl: stored.imageUrl.trim(),
    imageFocusX: stored.imageFocusX ?? DEFAULT_PERSO_BANNER_FOCUS_X,
    imageFocusY: stored.imageFocusY ?? DEFAULT_PERSO_BANNER_FOCUS_Y,
    cityVisuals: stored.cityVisuals ?? {},
    eyebrow: stored.eyebrow.trim() || CATALOG_PERSO_BANNER_COPY.eyebrow,
    title: stored.title.trim() || CATALOG_PERSO_BANNER_COPY.title,
    subtitle: stored.subtitle.trim() || CATALOG_PERSO_BANNER_COPY.subtitle,
    ctaLabel: normalizeCatalogPersoCtaLabel(stored.ctaLabel),
  };
}

export function resolveAdminCatalogPersoBanner(
  stored: AdminCatalogPersoBanner | null | undefined,
): AdminCatalogPersoBanner {
  const publicBanner = resolveShopCatalogPersoBanner(stored);
  return {
    enabled: publicBanner.enabled,
    imageUrl: publicBanner.imageUrl,
    imageFocusX: publicBanner.imageFocusX,
    imageFocusY: publicBanner.imageFocusY,
    cityVisuals: publicBanner.cityVisuals,
    blobUrl: stored?.blobUrl ?? null,
    blobPathname: stored?.blobPathname ?? null,
    eyebrow: publicBanner.eyebrow,
    title: publicBanner.title,
    subtitle: publicBanner.subtitle,
    ctaLabel: publicBanner.ctaLabel,
    updatedAt: stored?.updatedAt ?? "",
  };
}
