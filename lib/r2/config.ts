import { browserSafeImageUrl } from "@/lib/media/browser-safe-image-url";

/** Nom du bucket R2 Cloudflare (sans le préfixe chemin objet `dingry/…`). */
export const R2_DEFAULT_BUCKET_NAME = "dingrybuckets";

/** URL publique navigateur (custom domain ou `pub-xxx.r2.dev`). */
export const R2_DEFAULT_PUBLIC_BASE = "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev";

/** Ancien pub R2 (401) — fichiers sur le bucket `dingrybuckets` via `R2_DEFAULT_PUBLIC_BASE`. */
export const DEPRECATED_R2_PUBLIC_ORIGIN = "https://pub-8ef850fa01fb9fda829a4ffa6455c86b.r2.dev";

function trimmed(name: string): string {
  return (process.env[name] ?? "").trim();
}

/** Pub R2 obsolète (401) : ignorer en env pour que upload + lecture ciblent le bucket actif. */
function activeR2PublicBase(base: string): string {
  const normalized = base.replace(/\/$/, "");
  try {
    if (new URL(normalized).origin === DEPRECATED_R2_PUBLIC_ORIGIN) {
      return R2_DEFAULT_PUBLIC_BASE;
    }
  } catch {
    return R2_DEFAULT_PUBLIC_BASE;
  }
  return normalized;
}

export function r2PublicBaseUrl(): string {
  const fromEnv = trimmed("R2_PUBLIC_BASE_URL");
  if (fromEnv) {
    if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) {
      return activeR2PublicBase(fromEnv);
    }
    return activeR2PublicBase(`https://${fromEnv.replace(/\/$/, "")}`);
  }
  const host = (trimmed("DINGRY_IMG_HOSTS").split(",")[0] ?? "").trim();
  if (host && !host.includes("://")) return activeR2PublicBase(`https://${host.replace(/\/$/, "")}`);
  if (host.startsWith("http")) {
    try {
      return activeR2PublicBase(new URL(host).origin);
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

/** Longueurs des clés « S3 API » Cloudflare R2 (pas le token API global du compte). */
export const R2_S3_ACCESS_KEY_ID_LENGTH = 32;
export const R2_S3_SECRET_ACCESS_KEY_LENGTH = 64;

/**
 * Détecte une config R2 typique (clés inversées, secret dans ACCESS_KEY_ID, etc.).
 * Ne retourne jamais les valeurs des clés.
 */
export function r2CredentialFormatError(): string | null {
  const accessKeyId = trimmed("R2_ACCESS_KEY_ID");
  const secretAccessKey = trimmed("R2_SECRET_ACCESS_KEY");
  if (!accessKeyId || !secretAccessKey) return null;

  if (accessKeyId.startsWith("cfat_") || secretAccessKey.startsWith("cfat_")) {
    return "Token API Cloudflare (préfixe cfat_) : incompatible avec l’upload S3. Créer un token « R2 / S3 API » (Access Key ID 32 + Secret 64) dans R2 → Manage R2 API Tokens.";
  }

  if (
    accessKeyId.length === R2_S3_SECRET_ACCESS_KEY_LENGTH &&
    secretAccessKey.length === R2_S3_ACCESS_KEY_ID_LENGTH
  ) {
    return "R2_ACCESS_KEY_ID et R2_SECRET_ACCESS_KEY semblent inversés (32 vs 64 caractères).";
  }

  if (accessKeyId.length !== R2_S3_ACCESS_KEY_ID_LENGTH) {
    const looksLikePublicUrl =
      /^https?:\/\//i.test(accessKeyId) ||
      accessKeyId.includes(".r2.dev") ||
      accessKeyId.includes("r2.cloudflarestorage.com");
    const hint = looksLikePublicUrl
      ? "Vous avez collé l’URL publique du bucket : la mettre uniquement dans R2_PUBLIC_BASE_URL / DINGRY_IMG_HOSTS, pas dans R2_ACCESS_KEY_ID."
      : accessKeyId.length === R2_S3_SECRET_ACCESS_KEY_LENGTH || accessKeyId.length === 65
        ? "La valeur ressemble à la clé secrète : la mettre dans R2_SECRET_ACCESS_KEY, pas R2_ACCESS_KEY_ID."
        : "Cloudflare → R2 → Manage R2 API Tokens → Create API token (permissions Object Read & Write sur le bucket) : utiliser l’« Access Key ID » (32 car.), pas le token API global ni l’URL publique.";
    return `R2_ACCESS_KEY_ID invalide (${accessKeyId.length} car., attendu ${R2_S3_ACCESS_KEY_ID_LENGTH}). ${hint}`;
  }

  if (secretAccessKey.length !== R2_S3_SECRET_ACCESS_KEY_LENGTH) {
    return `R2_SECRET_ACCESS_KEY invalide (${secretAccessKey.length} car., attendu ${R2_S3_SECRET_ACCESS_KEY_LENGTH}).`;
  }

  return null;
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

/** Réécrit un hôte `pub-….r2.dev` obsolète vers le bucket public actif (même clé objet). */
export function canonicalizeR2PublicImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || !trimmed.includes(".r2.dev")) return browserSafeImageUrl(trimmed);
  const key = objectKeyFromR2PublicUrl(trimmed);
  if (!key) return browserSafeImageUrl(trimmed);
  let canonical: string;
  try {
    const origin = new URL(trimmed).origin;
    if (origin === DEPRECATED_R2_PUBLIC_ORIGIN) {
      canonical = `${R2_DEFAULT_PUBLIC_BASE}/${key}`;
    } else {
      const fromEnv = r2PublicUrlForKey(key);
      canonical = origin === new URL(fromEnv).origin ? trimmed : fromEnv;
    }
  } catch {
    canonical = r2PublicUrlForKey(key);
  }
  return browserSafeImageUrl(canonical);
}
