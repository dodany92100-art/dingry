import { Redis } from "@upstash/redis";
import { clientIp } from "@/lib/request-ip";
import { getSharedRedis } from "@/lib/ratelimit";

const MAX_PER_IP = 8;
const MAX_GLOBAL = 40;
const WINDOW_SECONDS = 15 * 60;
const GLOBAL_KEY = "dingry:admin-login:global";

type AttemptBucket = {
  failures: number;
  resetAt: number;
};

const attempts = new Map<string, AttemptBucket>();

function ipKey(address: string): string {
  return `dingry:admin-login:ip:${address}`;
}

function memoryMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

function pruneExpired(now: number): void {
  for (const [address, bucket] of attempts) {
    if (bucket.resetAt <= now) attempts.delete(address);
  }
}

function memoryRetry(address: string, now = Date.now()): number {
  pruneExpired(now);
  const bucket = attempts.get(address);
  if (!bucket || bucket.failures < MAX_PER_IP) return 0;
  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

function memoryRecord(address: string, now = Date.now()): void {
  pruneExpired(now);
  const bucket = attempts.get(address);
  if (!bucket) {
    attempts.set(address, { failures: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return;
  }
  bucket.failures += 1;
}

export function clientAddress(request: Request): string {
  return clientIp(request);
}

async function retryFromRedis(client: Redis, address: string): Promise<number> {
  const waits = await Promise.all([
    bucketWait(client, ipKey(address), MAX_PER_IP),
    bucketWait(client, GLOBAL_KEY, MAX_GLOBAL),
  ]);
  return Math.max(waits[0], waits[1]);
}

async function bucketWait(client: Redis, key: string, max: number): Promise<number> {
  const count = Number((await client.get(key)) ?? 0);
  if (!Number.isFinite(count) || count < max) return 0;
  let ttl = await client.ttl(key);
  if (ttl < 1) {
    await client.expire(key, WINDOW_SECONDS);
    ttl = WINDOW_SECONDS;
  }
  return ttl;
}

async function hit(client: Redis, key: string): Promise<void> {
  const count = await client.incr(key);
  if (count === 1) await client.expire(key, WINDOW_SECONDS);
}

export async function loginRetryAfterSeconds(address: string): Promise<number | "unavailable"> {
  const client = getSharedRedis();
  if (!client) return memoryMode() ? memoryRetry(address) : "unavailable";
  try {
    return await retryFromRedis(client, address);
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
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
    await hit(client, GLOBAL_KEY);
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
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
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
  }
}

export function retryAfterLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}
