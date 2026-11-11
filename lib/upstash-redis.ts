import { Redis } from "@upstash/redis";

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

/** Client Redis partagé (Edge + Node) — sans dépendance Node-only. */
export function getSharedRedis(): Redis | null {
  const creds = upstashCredentials();
  if (!creds) return null;
  redisClient ??= new Redis({ url: creds.url, token: creds.token });
  return redisClient;
}
