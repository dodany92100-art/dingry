import { isHostSplitActive } from "@/lib/host-routing";

export const PREVIEW_COOKIE_NAME = "dingry_preview";
export const PREVIEW_TTL_SECONDS = 60 * 60 * 8;
export const MIN_PREVIEW_SECRET_LENGTH = 32;

type PreviewPayload = {
  exp: number;
  aud: "preview";
};

export function previewSecretFromEnv(): string {
  const raw = process.env.DINGRY_PREVIEW_SECRET?.trim() ?? "";
  if (!raw || raw.length < MIN_PREVIEW_SECRET_LENGTH) return "";
  return raw;
}

/** Actif seulement si split hostname + secret configurés. */
export function isPreviewFeatureEnabled(): boolean {
  return isHostSplitActive() && previewSecretFromEnv().length > 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function signaturesMatch(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length === 0 || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    const leftByte = a[index];
    const rightByte = b[index];
    if (leftByte === undefined || rightByte === undefined) return false;
    diff |= leftByte ^ rightByte;
  }
  return diff === 0;
}

async function signBody(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function signPreviewCookie(secret: string, now = Date.now()): Promise<{ token: string; maxAge: number }> {
  const payload: PreviewPayload = { exp: Math.floor(now / 1000) + PREVIEW_TTL_SECONDS, aud: "preview" };
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signBody(secret, body);
  return { token: `${body}.${signature}`, maxAge: PREVIEW_TTL_SECONDS };
}

export async function verifyPreviewCookie(token: string, secret: string, now = Date.now()): Promise<boolean> {
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, signature] = parts;
  if (!body || !signature) return false;

  const expected = await signBody(secret, body);
  if (!signaturesMatch(signature, expected)) return false;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as Partial<PreviewPayload>;
    if (parsed.aud !== "preview") return false;
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp) || parsed.exp * 1000 <= now) return false;
    return true;
  } catch {
    return false;
  }
}