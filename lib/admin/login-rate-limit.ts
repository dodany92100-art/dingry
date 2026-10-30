const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptBucket = {
  failures: number;
  resetAt: number;
};

const attempts = new Map<string, AttemptBucket>();

function pruneExpired(now: number): void {
  for (const [address, bucket] of attempts) {
    if (bucket.resetAt <= now) attempts.delete(address);
  }
}

export function clientAddress(request: Request): string {
  const header =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for") ||
    "";
  const address = header.split(",")[0]?.trim() ?? "";
  return address || "unknown";
}

export function loginRetryAfterSeconds(address: string, now = Date.now()): number {
  pruneExpired(now);
  const bucket = attempts.get(address);
  if (!bucket || bucket.failures < MAX_FAILURES) return 0;
  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

export function recordLoginFailure(address: string, now = Date.now()): void {
  pruneExpired(now);
  const bucket = attempts.get(address);
  if (!bucket) {
    attempts.set(address, { failures: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.failures += 1;
}

export function clearLoginFailures(address: string): void {
  attempts.delete(address);
}

export function retryAfterLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}
