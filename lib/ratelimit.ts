import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { clientIp } from "@/lib/request-ip";

const WINDOW_TOKENS = 5;
const WINDOW = "10 s";
const REDIS_TIMEOUT_MS = 3000;
const PAYPAL_ORDER_TTL_SECONDS = 60 * 60 * 24 * 90;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!redisUrl || !redisToken) return null;
  redisClient ??= new Redis({ url: redisUrl, token: redisToken });
  return redisClient;
}

export function getSharedRedis(): Redis | null {
  return getRedis();
}

const redis = getRedis();

const checkoutRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(WINDOW_TOKENS, WINDOW),
      prefix: "dingry:checkout",
      analytics: true,
      timeout: REDIS_TIMEOUT_MS,
    })
  : null;

const webhookRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, WINDOW),
      prefix: "dingry:paypal-webhook",
      analytics: true,
      timeout: REDIS_TIMEOUT_MS,
    })
  : null;

export { clientIp };

export type CheckoutRateLimit =
  | { ok: true; limit: number; remaining: number }
  | { ok: false; status: 429; error: string; retryAfter: number; limit: number; remaining: number }
  | { ok: false; status: 503; error: string };

function paypalOrderKey(orderId: string): string {
  return `dingry:paypal-order:${orderId}`;
}

export async function claimPayPalOrder(orderId: string): Promise<"claimed" | "duplicate" | "unavailable"> {
  const client = getRedis();
  if (!client) return "unavailable";
  try {
    const result = await client.set(paypalOrderKey(orderId), "1", { nx: true, ex: PAYPAL_ORDER_TTL_SECONDS });
    return result === "OK" ? "claimed" : "duplicate";
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
    return "unavailable";
  }
}

export async function releasePayPalOrder(orderId: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(paypalOrderKey(orderId));
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
  }
}

export async function limitPayPalWebhook(ip: string): Promise<CheckoutRateLimit> {
  if (!webhookRatelimit) {
    return { ok: false, status: 503, error: "Enregistrement indisponible." };
  }
  return slide(webhookRatelimit, ip, "Enregistrement indisponible.");
}

export async function limitCheckout(ip: string): Promise<CheckoutRateLimit> {
  if (!checkoutRatelimit) {
    return { ok: false, status: 503, error: "Limitation de débit indisponible." };
  }
  return slide(checkoutRatelimit, ip, "Limitation de débit indisponible.");
}

async function slide(
  limiter: Ratelimit,
  ip: string,
  unavailable: string,
): Promise<CheckoutRateLimit> {
  const identifier = ip.trim().slice(0, 80) || "unknown";

  try {
    const result = await limiter.limit(identifier);
    void result.pending;

    if (result.reason === "timeout") {
      return { ok: false, status: 503, error: unavailable };
    }

    if (!result.success) {
      const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return {
        ok: false,
        status: 429,
        error: "Trop de tentatives. Réessayez dans un instant.",
        retryAfter,
        limit: result.limit,
        remaining: result.remaining,
      };
    }

    return { ok: true, limit: result.limit, remaining: result.remaining };
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
    return { ok: false, status: 503, error: unavailable };
  }
}
