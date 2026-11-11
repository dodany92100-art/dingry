import type { AdminCatalogPersoBanner } from "@/lib/admin/types";
import { parsePersoBannerLinkMeta, encodePersoBannerLink } from "@/lib/catalog-perso-banner-cities";
import { supabaseAdmin } from "@/lib/supabase/server";

export const SHOP_BANNER_POSITION_CATALOG_PERSO = "catalog_perso" as const;
export const SHOP_BANNER_POSITION_ATELIER_CUSTOM = "atelier_custom" as const;

export type ShopBannerRow = {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  cta_label: string;
  image_url: string;
  link_url: string;
  image_blob_pathname: string | null;
  position: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicShopBanner = {
  id: string;
  position: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  ctaLabel: string;
  imageUrl: string;
  linkUrl: string;
};

export function rowToPublicShopBanner(row: ShopBannerRow): PublicShopBanner {
  return {
    id: row.id,
    position: row.position,
    title: row.title,
    subtitle: row.subtitle,
    eyebrow: row.eyebrow,
    ctaLabel: row.cta_label,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
  };
}

export function rowToAdminCatalogPersoBanner(row: ShopBannerRow): AdminCatalogPersoBanner {
  const meta = parsePersoBannerLinkMeta(row.link_url);
  return {
    enabled: row.is_active,
    imageUrl: row.image_url,
    blobUrl: row.image_url,
    blobPathname: row.image_blob_pathname,
    imageFocusX: meta.imageFocusX,
    imageFocusY: meta.imageFocusY,
    cityVisuals: meta.cityVisuals,
    eyebrow: row.eyebrow,
    title: row.title,
    subtitle: row.subtitle,
    ctaLabel: row.cta_label,
    updatedAt: row.updated_at,
  };
}

export async function getSupabaseShopBannerByPosition(
  position: string,
): Promise<ShopBannerRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("shop_banners")
    .select("*")
    .eq("position", position)
    .maybeSingle();
  if (error) {
    if (error.code === "PGRST205" || error.message.includes("schema cache")) return null;
    throw new Error(error.message);
  }
  return data ? (data as ShopBannerRow) : null;
}

export async function listSupabaseShopBanners(options?: { activeOnly?: boolean }): Promise<ShopBannerRow[]> {
  let query = supabaseAdmin().from("shop_banners").select("*").order("position", { ascending: true });
  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query;
  if (error) {
    if (error.code === "PGRST205" || error.message.includes("schema cache")) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as ShopBannerRow[];
}

export async function upsertSupabaseAtelierCustomJson(
  json: string,
  enabled: boolean,
): Promise<string> {
  const position = SHOP_BANNER_POSITION_ATELIER_CUSTOM;
  const existing = await getSupabaseShopBannerByPosition(position);
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const row = {
    id,
    title: "Atelier CUSTOM",
    subtitle: "Configuration personnalisation",
    eyebrow: "Atelier",
    cta_label: "CUSTOM",
    image_url: existing?.image_url?.trim() || "/dingry-favicon.jpg",
    link_url: json,
    image_blob_pathname: existing?.image_blob_pathname ?? null,
    position,
    is_active: enabled,
    updated_at: now,
    ...(existing ? {} : { created_at: now }),
  };
  const { error } = await supabaseAdmin().from("shop_banners").upsert(row, { onConflict: "position" });
  if (error) throw new Error(error.message);
  return now;
}

export async function readSupabaseAtelierCustomJson(): Promise<{ json: string | null; updatedAt: string }> {
  const row = await getSupabaseShopBannerByPosition(SHOP_BANNER_POSITION_ATELIER_CUSTOM);
  return {
    json: row?.link_url?.trim() ? row.link_url : null,
    updatedAt: row?.updated_at ?? "",
  };
}

export async function upsertSupabaseCatalogPersoBanner(
  banner: AdminCatalogPersoBanner,
  position: string = SHOP_BANNER_POSITION_CATALOG_PERSO,
): Promise<AdminCatalogPersoBanner> {
  const existing = await getSupabaseShopBannerByPosition(position);
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const row = {
    id,
    title: banner.title,
    subtitle: banner.subtitle,
    eyebrow: banner.eyebrow,
    cta_label: banner.ctaLabel,
    image_url: banner.imageUrl,
    link_url: encodePersoBannerLink(banner.imageFocusX, banner.imageFocusY, banner.cityVisuals),
    image_blob_pathname: banner.blobPathname,
    position,
    is_active: banner.enabled,
    updated_at: now,
    ...(existing ? {} : { created_at: now }),
  };
  const { data, error } = await supabaseAdmin()
    .from("shop_banners")
    .upsert(row, { onConflict: "position" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToAdminCatalogPersoBanner(data as ShopBannerRow);
}
