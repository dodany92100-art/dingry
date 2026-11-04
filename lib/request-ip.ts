/**
 * IP client sur Vercel, sans proxy Cloudflare devant le domaine.
 * `cf-connecting-ip` est ignoré : un client peut l'inventer en appelant `*.vercel.app`.
 * En production : uniquement `x-vercel-forwarded-for` (les autres en-têtes sont forgeables).
 */
const IP_HEADERS = ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"] as const;
const PRODUCTION_IP_HEADERS = ["x-vercel-forwarded-for"] as const;
const IP_PATTERN = /^[a-fA-F0-9:.]+$/;

export function clientIp(request: Request): string {
  const headers =
    process.env.NODE_ENV === "production" ? PRODUCTION_IP_HEADERS : IP_HEADERS;
  for (const name of headers) {
    const raw = request.headers.get(name);
    if (!raw) continue;
    const address = raw.split(",")[0]?.trim() ?? "";
    if (address.length > 0 && address.length <= 80 && IP_PATTERN.test(address)) return address;
  }
  return "unknown";
}
