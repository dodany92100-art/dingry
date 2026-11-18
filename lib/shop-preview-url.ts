import { shopHostsFromEnv } from "@/lib/host-routing";

function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Origin vitrine pour l’aperçu (env > SITE_URL > DINGRY_SHOP_HOSTS). */
export function shopWebsitedxOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_DINGRY_SHOP_PREVIEW_URL?.trim() ??
    process.env.DINGRY_SHOP_PREVIEW_URL?.trim() ??
    "";
  if (explicit) return normalizeOrigin(explicit);

  const fromSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromSite) return normalizeOrigin(fromSite);

  const shops = shopHostsFromEnv();
  if (shops.has("www.dingry.com")) return "https://www.dingry.com";
  const first = shops.values().next().value as string | undefined;
  if (first) return `https://${first}`;

  return "https://www.dingry.com";
}

export function shopWebsitedxUrl(): string {
  return `${shopWebsitedxOrigin()}/websitedx`;
}