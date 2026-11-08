/** Nom du bucket R2 Cloudflare (sans le préfixe chemin objet `dingry/…`). */
export const R2_DEFAULT_BUCKET_NAME = "dingrybuckets";

/** URL publique navigateur (custom domain ou `pub-xxx.r2.dev`). */
export const R2_DEFAULT_PUBLIC_BASE = "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev";

function trimmed(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function r2PublicBaseUrl(): string {
  const fromEnv = trimmed("R2_PUBLIC_BASE_URL");
  if (fromEnv) {
    if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) {
      return fromEnv.replace(/\/$/, "");
    }
    return `https://${fromEnv.replace(/\/$/, "")}`;
  }
  const host = (trimmed("DINGRY_IMG_HOSTS").split(",")[0] ?? "").trim();
  if (host && !host.includes("://")) return `https://${host.replace(/\/$/, "")}`;
  if (host.startsWith("http")) {
    try {
      return new URL(host).origin;
    } catch {
      return R2_DEFAULT_PUBLIC_BASE;
    }
  }
  return R2_DEFAULT_PUBLIC_BASE;
}

export function r2BucketName(): string {
  return trimmed("R2_BUCKET_NAME") || R2_DEFAULT_BUCKET_NAME;
}

export function r2AccountId(): string {
  return trimmed("R2_ACCOUNT_ID");
}

export function r2S3Endpoint(): string {
  const custom = trimmed("R2_S3_ENDPOINT");
  if (custom) return custom.replace(/\/$/, "");
  const account = r2AccountId();
  if (!account) return "";
  return `https://${account}.r2.cloudflarestorage.com`;
}

/** Upload CRM → R2 (clés API S3, pas l’URL publique seule). */
export function isR2ImageStorageEnabled(): boolean {
  if (process.env.VITEST === "true") {
    return Boolean(
      trimmed("R2_ACCESS_KEY_ID") &&
        trimmed("R2_SECRET_ACCESS_KEY") &&
        r2AccountId() &&
        r2BucketName(),
    );
  }
  return Boolean(
    trimmed("R2_ACCESS_KEY_ID") &&
      trimmed("R2_SECRET_ACCESS_KEY") &&
      r2AccountId() &&
      r2BucketName() &&
      r2S3Endpoint(),
  );
}

export function r2PublicUrlForKey(objectKey: string): string {
  const base = r2PublicBaseUrl();
  const path = objectKey.replace(/^\/+/, "");
  return `${base}/${path}`;
}

export function objectKeyFromR2PublicUrl(url: string): string | null {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;
  try {
    const base = r2PublicBaseUrl();
    const parsed = new URL(trimmedUrl);
    const baseParsed = new URL(base);
    if (parsed.origin !== baseParsed.origin) {
      if (!parsed.hostname.endsWith(".r2.dev")) return null;
    }
    const prefix = baseParsed.pathname.replace(/\/$/, "");
    let pathname = parsed.pathname;
    if (prefix && pathname.startsWith(prefix)) {
      pathname = pathname.slice(prefix.length);
    }
    const key = pathname.replace(/^\/+/, "");
    return key || null;
  } catch {
    return null;
  }
}

export function isR2PublicUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const trimmedUrl = url.trim();
  if (trimmedUrl.includes(".r2.dev")) return true;
  try {
    return new URL(trimmedUrl).origin === new URL(r2PublicBaseUrl()).origin;
  } catch {
    return false;
  }
}
