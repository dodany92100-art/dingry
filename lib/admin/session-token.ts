const SESSION_TTL_SECONDS = 60 * 60 * 8;

export const ADMIN_COOKIE_NAME = "dingry_admin";

type SessionPayload = {
  exp: number;
  sid: string;
};

export function sessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS;
}

export function normalizeSessionSecret(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function sessionSecretFromEnv(): string {
  const raw = process.env.ADMIN_TOTP_SECRET?.trim() ?? "";
  return raw ? normalizeSessionSecret(raw) : "";
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
  for (let index = 0; index < a.length; index += 1) diff |= a[index] ^ b[index];
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

export async function signAdminSession(secret: string, now = Date.now()): Promise<{ token: string; maxAge: number }> {
  const sidBytes = new Uint8Array(16);
  crypto.getRandomValues(sidBytes);
  const sid = Array.from(sidBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const payload: SessionPayload = { exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS, sid };
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signBody(secret, body);
  return { token: `${body}.${signature}`, maxAge: SESSION_TTL_SECONDS };
}

export async function verifyAdminSession(token: string, secret: string, now = Date.now()): Promise<boolean> {
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, signature] = parts;
  if (!body || !signature) return false;

  const expected = await signBody(secret, body);
  if (!signaturesMatch(signature, expected)) return false;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as Partial<SessionPayload>;
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp) || parsed.exp * 1000 <= now) return false;
    return typeof parsed.sid === "string" && /^[a-f0-9]{32}$/.test(parsed.sid);
  } catch {
    return false;
  }
}
