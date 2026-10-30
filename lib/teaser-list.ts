import { Ratelimit } from "@upstash/ratelimit";
import { getSharedRedis } from "@/lib/ratelimit";

const EMAILS_KEY = "dingry:teaser-emails";
const SIGNED_AT_KEY = "dingry:teaser-signed-at";
const REDIS_TIMEOUT_MS = 3000;

let teaserLimiter: Ratelimit | null | undefined;

function limiter(): Ratelimit | null {
  if (teaserLimiter !== undefined) return teaserLimiter;
  const redis = getSharedRedis();
  teaserLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "60 s"),
        prefix: "dingry:teaser",
        analytics: true,
        timeout: REDIS_TIMEOUT_MS,
      })
    : null;
  return teaserLimiter;
}

export async function limitTeaserSignup(
  ip: string,
): Promise<{ ok: true } | { ok: false; status: 429 | 503; error: string; retryAfter?: number }> {
  const bucket = limiter();
  if (!bucket) return { ok: false, status: 503, error: "Inscription indisponible." };
  try {
    const result = await bucket.limit(ip.trim().slice(0, 80) || "unknown");
    void result.pending;
    if (result.reason === "timeout") return { ok: false, status: 503, error: "Inscription indisponible." };
    if (!result.success) {
      return {
        ok: false,
        status: 429,
        error: "Trop de tentatives. Réessayez dans un instant.",
        retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      };
    }
    return { ok: true };
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
    return { ok: false, status: 503, error: "Inscription indisponible." };
  }
}

export async function saveTeaserEmail(email: string): Promise<"saved" | "duplicate" | "unavailable"> {
  const client = getSharedRedis();
  if (!client) return "unavailable";
  try {
    const added = await client.sadd(EMAILS_KEY, email);
    if (added === 1) {
      await client.hset(SIGNED_AT_KEY, { [email]: new Date().toISOString() });
    }
    return added === 1 ? "saved" : "duplicate";
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
    return "unavailable";
  }
}
