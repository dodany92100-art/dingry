import { Ratelimit } from "@upstash/ratelimit";
import { getSharedRedis } from "@/lib/upstash-redis";

const REDIS_TIMEOUT_MS = 3000;
const IDENTIFIER_MAX = 80;

export type EdgeRateLimitResult =
  | { ok: true; limit: number; remaining: number }
  | { ok: false; status: 429; error: string; retryAfter: number; limit: number; remaining: number }
  | { ok: false; status: 503; error: string };

type EdgeBucket = {
  prefix: string;
  tokens: number;
  window: `${number} s` | `${number} m`;
};

const EDGE_BUCKETS: Record<string, EdgeBucket> = {
  "/api/checkout": { prefix: "dingry:edge:checkout", tokens: 20, window: "60 s" },
  "/api/teaser": { prefix: "dingry:edge:teaser", tokens: 8, window: "60 s" },
  "/api/upload": { prefix: "dingry:edge:upload", tokens: 15, window: "60 s" },
};

const limiterCache = new Map<string, Ratelimit>();

function limiterFor(bucket: EdgeBucket): Ratelimit | null {
  const cached = limiterCache.get(bucket.prefix);
  if (cached) return cached;
  const redis = getSharedRedis();
  if (!redis) return null;
  const created = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(bucket.tokens, bucket.window),
    prefix: bucket.prefix,
    timeout: REDIS_TIMEOUT_MS,
  });
  limiterCache.set(bucket.prefix, created);
  return created;
}

function rateLimitIdentifier(ip: string): string | null {
  const trimmed = ip.trim().slice(0, IDENTIFIER_MAX);
  if (trimmed.length > 0 && trimmed !== "unknown") return trimmed;
  if (process.env.NODE_ENV === "development") return "dev-local";
  return null;
}

export function isEdgeWriteRateLimitPath(pathname: string): boolean {
  return pathname in EDGE_BUCKETS;
}

export async function limitEdgeApiWrite(pathname: string, ip: string): Promise<EdgeRateLimitResult> {
  const bucket = EDGE_BUCKETS[pathname];
  if (!bucket) return { ok: true, limit: 0, remaining: 0 };

  const limiter = limiterFor(bucket);
  if (!limiter) {
    if (process.env.NODE_ENV === "development") {
      return { ok: true, limit: 0, remaining: 0 };
    }
    return { ok: false, status: 503, error: "Service momentanément indisponible." };
  }

  const identifier = rateLimitIdentifier(ip);
  if (!identifier) {
    return { ok: false, status: 503, error: "Service momentanément indisponible." };
  }

  try {
    const result = await limiter.limit(identifier);
    if (result.reason === "timeout") {
      return { ok: false, status: 503, error: "Service momentanément indisponible." };
    }
    if (!result.success) {
      const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return {
        ok: false,
        status: 429,
        error: "Trop de requêtes. Merci de patienter avant de réessayer.",
        retryAfter,
        limit: result.limit,
        remaining: result.remaining,
      };
    }
    return { ok: true, limit: result.limit, remaining: result.remaining };
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
    return { ok: false, status: 503, error: "Service momentanément indisponible." };
  }
}
