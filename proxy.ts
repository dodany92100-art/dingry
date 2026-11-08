import { handleProxyRequest, PROXY_MATCHER } from "@/lib/proxy-gate";

export async function proxy(request: Parameters<typeof handleProxyRequest>[0]) {
  return handleProxyRequest(request);
}

export const config = {
  matcher: [...PROXY_MATCHER],
};
