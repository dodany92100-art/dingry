import { Redis } from "@upstash/redis";
import { clientIp } from "@/lib/request-ip";
import { sendOpsAlertOnce } from "@/lib/ops-alert";
import { getSharedRedis } from "@/lib/ratelimit";

const MAX_PER_IP = 8;
/** Seuil global élevé : limite le brute-force distribué sans verrouillage facile par un bot léger. */
export const MAX_GLOBAL_LOGIN_FAILURES = 30;
const WINDOW_SECONDS = 15 * 60;
const GLOBAL_KEY = "dingry:admin-login:global";

const INCR_WINDOW_LUA = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return c
`;

type AttemptBucket = {
  failures: number;
  resetAt: number;
};

const attempts = new Map<string, AttemptBucket>();
let memoryGlobalFailures = 0;
let memoryGlobalResetAt = 0;

function ipKey(address: string): string {
  return `dingry:admin-login:ip:${address}`;
}

function memoryMode(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  return false;
}

/** Refuse le login si l’IP n’est pas identifiable (prod Vercel uniquement). */
export function loginClientAddressBlocked(address: string): boolean {
  if (address !== "unknown") return false;
  if (process.env.NODE_ENV === "development") return false;
  if (process.env.VERCEL_ENV === "preview") return false;
  return true;
}

function pruneExpired(now: number): void {
  for (const [address, bucket] of attempts) {
    if (bucket.resetAt <= now) attempts.delete(address);
  }
  if (memoryGlobalResetAt <= now) {
    memoryGlobalFailures = 0;
    memoryGlobalResetAt = 0;
  }
}

function memoryGlobalRetry(now = Date.now()): number {
  if (memoryGlobalFailures < MAX_GLOBAL_LOGIN_FAILURES) return 0;
  return Math.max(1, Math.ceil((memoryGlobalResetAt - now) / 1000));
}

function memoryRetry(address: string, now = Date.now()): number {
  pruneExpired(now);
  return Math.max(memoryGlobalRetry(now), memoryIpRetry(address, now));
}

function memoryIpRetry(address: string, now: number): number {
  const bucket = attempts.get(address);
  if (!bucket || bucket.failures < MAX_PER_IP) return 0;
  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

function memoryRecord(address: string, now = Date.now()): void {
  pruneExpired(now);
  const bucket = attempts.get(address);
  if (!bucket) {
    attempts.set(address, { failures: 1, resetAt: now + WINDOW_SECONDS * 1000 });
  } else {
    bucket.failures += 1;
  }
  if (memoryGlobalResetAt <= now) {
    memoryGlobalResetAt = now + WINDOW_SECONDS * 1000;
    memoryGlobalFailures = 1;
  } else {
    memoryGlobalFailures += 1;
  }
  if (memoryGlobalFailures === MAX_GLOBAL_LOGIN_FAILURES) {
    void sendOpsAlertOnce("admin-login-global-lock", "Blocage login admin", {
      reason: `${MAX_GLOBAL_LOGIN_FAILURES} échecs globaux en ${WINDOW_SECONDS / 60} min — DEL ${GLOBAL_KEY} si légitime`,
    });
  }
}

export function clientAddress(request: Request): string {
  return clientIp(request);
}

async function retryFromRedis(client: Redis, address: string): Promise<number> {
  const waits = await Promise.all([
    bucketWait(client, ipKey(address), MAX_PER_IP),
    bucketWait(client, GLOBAL_KEY, MAX_GLOBAL_LOGIN_FAILURES),
  ]);
  return Math.max(waits[0], waits[1]);
}

async function bucketWait(client: Redis, key: string, max: number): Promise<number> {
  const count = Number((await client.get(key)) ?? 0);
  if (!Number.isFinite(count) || count < max) return 0;
  const ttl = await client.ttl(key);
  if (ttl < 0) return 0;
  if (ttl < 1) {
    await client.expire(key, WINDOW_SECONDS);
    return WINDOW_SECONDS;
  }
  return ttl;
}

async function hit(client: Redis, key: string): Promise<number> {
  const count = (await client.eval(INCR_WINDOW_LUA, [key], [String(WINDOW_SECONDS)])) as number;
  return count;
}

export async function loginRetryAfterSeconds(address: string): Promise<number | "unavailable"> {
  const client = getSharedRedis();
  if (!client) return memoryMode() ? memoryRetry(address) : "unavailable";
  try {
    return await retryFromRedis(client, address);
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.name : "erreur");
    return memoryMode() ? memoryRetry(address) : "unavailable";
  }
}

export async function recordLoginFailure(address: string): Promise<void> {
  const client = getSharedRedis();
  if (!client) {
    if (memoryMode()) memoryRecord(address);
    return;
  }
  try {
    await hit(client, ipKey(address));
    const globalCount = await hit(client, GLOBAL_KEY);
    if (globalCount === MAX_GLOBAL_LOGIN_FAILURES) {
      void sendOpsAlertOnce("admin-login-global-lock", "Blocage login admin", {
        reason: `${MAX_GLOBAL_LOGIN_FAILURES} échecs globaux en ${WINDOW_SECONDS / 60} min — DEL ${GLOBAL_KEY} si légitime`,
      });
    }
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.name : "erreur");
    if (memoryMode()) memoryRecord(address);
  }
}

export async function clearLoginFailures(address: string): Promise<void> {
  attempts.delete(address);
  const client = getSharedRedis();
  if (!client) return;
  try {
    await client.del(ipKey(address));
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.name : "erreur");
  }
}

export function retryAfterLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}
