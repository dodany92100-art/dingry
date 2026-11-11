import { formatRetryAfterLabel, retryAfterFromHeaders } from "@/lib/rate-limit-response";

/** Message boutique premium pour les réponses HTTP 429. */
export function clientRateLimitMessage(
  response: Response,
  serverError: string | undefined,
  fallback: string,
): string {
  if (response.status !== 429) return serverError?.trim() || fallback;
  const retryAfter = retryAfterFromHeaders(response.headers);
  const base = serverError?.trim() || fallback;
  if (!retryAfter) return base;
  return `${base} Réessayez dans ${formatRetryAfterLabel(retryAfter)}.`;
}
