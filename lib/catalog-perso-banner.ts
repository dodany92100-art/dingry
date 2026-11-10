import { DINGRY_PRODUCT_MEDIA } from "@/lib/dingry-product-media";
import type { AdminCatalogPersoBanner, ShopCatalogPersoBanner } from "@/lib/admin/types";

export const DEFAULT_CATALOG_PERSO_BANNER: ShopCatalogPersoBanner = {
  enabled: true,
  imageUrl: DINGRY_PRODUCT_MEDIA.customConfiguratorBanner,
  eyebrow: "Custom · Configurateur",
  title: "Ville, texte sous le logo",
  subtitle: "Tee personnalisable · aperçu en direct",
  ctaLabel: "CUSTOM",
};

function normalizeCatalogPersoCtaLabel(label: string | undefined): string {
  const trimmed = label?.trim() ?? "";
  if (!trimmed) return DEFAULT_CATALOG_PERSO_BANNER.ctaLabel;
  if (trimmed.localeCompare("Personnaliser", undefined, { sensitivity: "accent" }) === 0) {
    return "CUSTOM";
  }
  return trimmed;
}

export function resolveShopCatalogPersoBanner(
  stored: AdminCatalogPersoBanner | null | undefined,
): ShopCatalogPersoBanner {
  if (!stored) return { ...DEFAULT_CATALOG_PERSO_BANNER };
  const imageUrl = stored.imageUrl.trim() || DEFAULT_CATALOG_PERSO_BANNER.imageUrl;
  return {
    enabled: stored.enabled,
    imageUrl,
    eyebrow: stored.eyebrow.trim() || DEFAULT_CATALOG_PERSO_BANNER.eyebrow,
    title: stored.title.trim() || DEFAULT_CATALOG_PERSO_BANNER.title,
    subtitle: stored.subtitle.trim() || DEFAULT_CATALOG_PERSO_BANNER.subtitle,
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
    blobUrl: stored?.blobUrl ?? null,
    blobPathname: stored?.blobPathname ?? null,
    eyebrow: publicBanner.eyebrow,
    title: publicBanner.title,
    subtitle: publicBanner.subtitle,
    ctaLabel: publicBanner.ctaLabel,
    updatedAt: stored?.updatedAt ?? "",
  };
}
