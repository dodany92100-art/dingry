import { getSiteUrl } from "@/lib/site-url";

/** Origin des URLs retour PayPal — doit être le même hôte que celui qui crée le brouillon Redis. */
export function payPalReturnOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? "";
  const hostHeader = request.headers.get("host")?.trim() ?? "";
  const host = forwardedHost || hostHeader || url.host;

  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase() ||
      (url.protocol === "http:" ? "http" : "https");
    if (proto === "http" || proto === "https") {
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }

  return getSiteUrl().origin;
}
