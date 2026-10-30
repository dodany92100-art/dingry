import { randomUUID } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const COARSE_WINDOW_TOKENS = 60;
const QUOTE_WINDOW_TOKENS = 20;
const PAYMENT_WINDOW_TOKENS = 5;
const QUOTE_WINDOW = "10 s" as const;
const PAYMENT_WINDOW = "60 s" as const;
const COARSE_WINDOW = "10 s" as const;
const WEBHOOK_WINDOW = "10 s" as const;
const REDIS_TIMEOUT_MS = 3000;
/** Doit rester > durée max probable de capture + persistance (voir `maxDuration` sur `/api/checkout`). */
const PAYPAL_ORDER_LOCK_TTL_SECONDS = 180;
const PAYPAL_ORDER_DONE_TTL_SECONDS = 60 * 60 * 24 * 90;

function stripEnv(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

let redisClient: Redis | null = null;

function upstashCredentials(): { url: string; token: string } | null {
  const url = stripEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = stripEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url || !token) return null;
  return { url, token };
}

function getRedis(): Redis | null {
  const creds = upstashCredentials();
  if (!creds) {
    return null;
  }
  redisClient ??= new Redis({ url: creds.url, token: creds.token });
  return redisClient;
}

export function getSharedRedis(): Redis | null {
  return getRedis();
}

function buildLimiter(
  prefix: string,
  tokens: number,
  window: typeof QUOTE_WINDOW | typeof PAYMENT_WINDOW | typeof COARSE_WINDOW,
): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix,
    timeout: REDIS_TIMEOUT_MS,
  });
}

const checkoutEntryRatelimit = buildLimiter("dingry:checkout-entry", COARSE_WINDOW_TOKENS, COARSE_WINDOW);
const checkoutQuoteRatelimit = buildLimiter("dingry:checkout-quote", QUOTE_WINDOW_TOKENS, QUOTE_WINDOW);
const checkoutPaymentRatelimit = buildLimiter("dingry:checkout-pay", PAYMENT_WINDOW_TOKENS, PAYMENT_WINDOW);
const webhookRatelimit = buildLimiter("dingry:paypal-webhook", 30, WEBHOOK_WINDOW);

export type CheckoutRateLimit =
  | { ok: true; limit: number; remaining: number }
  | { ok: false; status: 429; error: string; retryAfter: number; limit: number; remaining: number }
  | { ok: false; status: 503; error: string };

function paypalOrderKey(orderId: string): string {
  return `dingry:paypal-order:${orderId}`;
}

function lockValue(token: string): string {
  return `lock:${token}`;
}

function logRedisError(scope: string, error: unknown): void {
  console.error(scope, error instanceof Error ? error.name : typeof error);
}

export type PayPalOrderClaim =
  | { status: "claimed"; token: string }
  | { status: "duplicate" }
  | { status: "unavailable" };

export type PayPalOrderMarker = "absent" | "in_progress" | "done" | "unknown";

export async function readPayPalOrderMarker(orderId: string): Promise<PayPalOrderMarker> {
  const client = getRedis();
  if (!client) return "absent";
  try {
    const value = await client.get<string>(paypalOrderKey(orderId));
    if (value === null || value === undefined) return "absent";
    if (value === "done") return "done";
    if (typeof value === "string" && value.startsWith("lock:")) return "in_progress";
    return "unknown";
  } catch (error) {
    logRedisError("Upstash injoignable", error);
    return "unknown";
  }
}

export async function claimPayPalOrder(orderId: string): Promise<PayPalOrderClaim> {
  const client = getRedis();
  if (!client) return { status: "unavailable" };
  const token = randomUUID();
  try {
    const result = await client.set(paypalOrderKey(orderId), lockValue(token), {
      nx: true,
      ex: PAYPAL_ORDER_LOCK_TTL_SECONDS,
    });
    return result === "OK" ? { status: "claimed", token } : { status: "duplicate" };
  } catch (error) {
    logRedisError("Upstash injoignable", error);
    return { status: "unavailable" };
  }
}

/** Marque la commande PayPal comme enregistrée (TTL long). Ne remplace que notre verrou court. */
export async function completePayPalOrder(orderId: string, token: string): Promise<boolean> {
  const client = getRedis();
  if (!client) {
    console.error("PayPal complete sans Redis", orderId);
    return false;
  }
  const key = paypalOrderKey(orderId);
  const expected = lockValue(token);
  try {
    const result = await client.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then
         return redis.call("set", KEYS[1], "done", "EX", ARGV[2])
       end
       return 0`,
      [key],
      [expected, String(PAYPAL_ORDER_DONE_TTL_SECONDS)],
    );
    if (result === 0) {
      console.error("PayPal marqueur non posé (verrou expiré ou token)", orderId);
      return false;
    }
    return true;
  } catch (error) {
    logRedisError("Upstash injoignable", error);
    return false;
  }
}

/** Libère le verrou court seulement s'il nous appartient encore. */
export async function releasePayPalOrder(orderId: string, token: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  const key = paypalOrderKey(orderId);
  const expected = lockValue(token);
  try {
    await client.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) end return 0`,
      [key],
      [expected],
    );
  } catch (error) {
    logRedisError("Upstash injoignable", error);
  }
}

export async function limitPayPalWebhook(ip: string): Promise<CheckoutRateLimit> {
  if (!webhookRatelimit) {
    return { ok: false, status: 503, error: "Enregistrement indisponible." };
  }
  return slide(webhookRatelimit, ip, "Enregistrement indisponible.");
}

export async function limitCheckoutEntry(ip: string): Promise<CheckoutRateLimit> {
  if (!checkoutEntryRatelimit) {
    if (process.env.NODE_ENV === "development") {
      return { ok: true, limit: 0, remaining: 0 };
    }
    return { ok: false, status: 503, error: "Limitation de débit indisponible." };
  }
  return slide(checkoutEntryRatelimit, ip, "Limitation de débit indisponible.");
}

export async function limitCheckoutQuote(ip: string): Promise<CheckoutRateLimit> {
  if (!checkoutQuoteRatelimit) {
    if (process.env.NODE_ENV === "development") {
      return { ok: true, limit: 0, remaining: 0 };
    }
    return { ok: false, status: 503, error: "Limitation de débit indisponible." };
  }
  return slide(checkoutQuoteRatelimit, ip, "Limitation de débit indisponible.");
}

export async function limitCheckoutPayment(ip: string): Promise<CheckoutRateLimit> {
  if (!checkoutPaymentRatelimit) {
    if (process.env.NODE_ENV === "development") {
      return { ok: true, limit: 0, remaining: 0 };
    }
    return { ok: false, status: 503, error: "Limitation de débit indisponible." };
  }
  return slide(checkoutPaymentRatelimit, ip, "Limitation de débit indisponible.");
}

function rateLimitIdentifier(ip: string): string | null {
  const trimmed = ip.trim().slice(0, 80);
  if (trimmed.length > 0 && trimmed !== "unknown") return trimmed;
  if (process.env.NODE_ENV === "development") return "dev-local";
  return null;
}

async function slide(
  limiter: Ratelimit,
  ip: string,
  unavailable: string,
): Promise<CheckoutRateLimit> {
  const identifier = rateLimitIdentifier(ip);
  if (!identifier) {
    if (process.env.NODE_ENV === "production") {
      console.error("Rate limit refusé : IP client inconnue");
    }
    return { ok: false, status: 503, error: unavailable };
  }

  try {
    const result = await limiter.limit(identifier);

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
    logRedisError("Upstash injoignable", error);
    return { ok: false, status: 503, error: unavailable };
  }
}
