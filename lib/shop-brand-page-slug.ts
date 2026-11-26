import type { Brand } from "@/lib/admin/types";
import { shopHref, type ShopBasePath } from "@/lib/shop-base-path";
import {
  BRAND_PAGE_SLUGS,
  brandPageConfigForSlug,
  type BrandPageSlug,
} from "@/lib/shop-brand-page-config";

export { BRAND_PAGE_SLUGS, brandPageConfigForSlug };
export type { BrandPageSlug };

/** Slug URL valide ou `null` (pas de 4e marque — ex. `dingry-mada` rejeté). */
export function parseBrandPageSlug(raw: string | null | undefined): BrandPageSlug | null {
  if (raw == null || !String(raw).trim()) return null;
  const key = String(raw).trim().toLowerCase();
  if (!(BRAND_PAGE_SLUGS as readonly string[]).includes(key)) return null;
  return key as BrandPageSlug;
}

export function shopBrandPageHref(base: ShopBasePath, slug: BrandPageSlug): string {
  return shopHref(base, `/marque/${slug}`);
}

export function shopBrandCatalogQuery(brand: Brand): string {
  const params = new URLSearchParams();
  params.set("brand", brand);
  return `?${params.toString()}`;
}