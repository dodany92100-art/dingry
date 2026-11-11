import { jsonNoStore } from "@/lib/http";

export const RATE_LIMIT_API_CODE = "API-429" as const;

export type RateLimitDeny = {
  ok: false;
  status: 429;
  error: string;
  retryAfter: number;
  limit: number;
  remaining: number;
};

export function formatRetryAfterLabel(seconds: number): string {
  if (seconds < 60) {
    return seconds <= 1 ? "quelques secondes" : `${seconds} secondes`;
  }
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

export function retryAfterFromHeaders(headers: Headers): number | null {
  const raw = headers.get("Retry-After");
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
}

export function rateLimitMessage(error: string | undefined, retryAfterSeconds: number | null): string {
  const base = error?.trim() || "Trop de tentatives pour le moment.";
  if (!retryAfterSeconds || retryAfterSeconds < 1) return base;
  return `${base} Réessayez dans ${formatRetryAfterLabel(retryAfterSeconds)}.`;
}

export function jsonRateLimited(
  error: string,
  retryAfter: number,
  extra?: { limit?: number; remaining?: number },
) {
  const headers: Record<string, string> = {
    "Retry-After": String(Math.max(1, retryAfter)),
    "X-RateLimit-Limit": String(extra?.limit ?? 0),
    "X-RateLimit-Remaining": String(extra?.remaining ?? 0),
  };
  return jsonNoStore({ error, code: RATE_LIMIT_API_CODE }, { status: 429, headers });
}
