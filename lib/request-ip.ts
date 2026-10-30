/**
 * IP client sur Vercel, sans proxy Cloudflare devant le domaine.
 * `cf-connecting-ip` est ignoré : un client peut l'inventer en appelant `*.vercel.app`.
 * `x-forwarded-for` n'est utilisé qu'en dernier recours (premier élément).
 */
const IP_HEADERS = ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"] as const;
const IP_PATTERN = /^[a-fA-F0-9:.]+$/;

export function clientIp(request: Request): string {
  for (const name of IP_HEADERS) {
    const raw = request.headers.get(name);
    if (!raw) continue;
    const address = raw.split(",")[0]?.trim() ?? "";
    if (address.length > 0 && address.length <= 80 && IP_PATTERN.test(address)) return address;
  }
  return "unknown";
}
