const DEFAULT_SITE_ORIGIN = "https://dingry.com";

/** Origin absolu pour metadataBase / OG — ne doit jamais throw au build. */
export function getSiteUrl(): URL {
  const fromPublic = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  const vercelHost = process.env.VERCEL_URL?.trim() ?? "";
  const raw =
    fromPublic || (vercelHost ? `https://${vercelHost}` : "") || DEFAULT_SITE_ORIGIN;

  const normalized = raw.replace(/\/$/, "");
  const withScheme = /^https?:\/\//i.test(normalized)
    ? normalized
    : `https://${normalized}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return new URL(DEFAULT_SITE_ORIGIN);
    }
    return url;
  } catch {
    return new URL(DEFAULT_SITE_ORIGIN);
  }
}
