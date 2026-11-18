import { handleProxyRequest } from "@/lib/proxy-gate";

export async function proxy(request: Parameters<typeof handleProxyRequest>[0]) {
  return handleProxyRequest(request);
}

/** Aligné sur `PROXY_MATCHER` dans `lib/proxy-gate.ts` (analyse statique Turbopack). */
export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico).*)"],
};