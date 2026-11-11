import { handleProxyRequest } from "@/lib/proxy-gate";

export async function proxy(request: Parameters<typeof handleProxyRequest>[0]) {
  return handleProxyRequest(request);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/websitedx",
    "/checkout",
    "/checkout/:path*",
    "/api/catalog",
    "/api/catalog/:path*",
    "/api/checkout",
    "/api/lookbook",
    "/api/catalog-perso-banner",
    "/api/teaser",
    "/api/upload",
  ],
};
