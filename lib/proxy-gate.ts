import { NextResponse, type NextRequest } from "next/server";
import { isEdgeWriteRateLimitPath, limitEdgeApiWrite } from "@/lib/edge-api-rate-limit";
import { jsonNoStore } from "@/lib/http";
import {
  isTeaserGateActive,
  isTeaserGatePublicReturnPath,
  isTeaserGatedPath,
} from "@/lib/dingry-teaser-gate";
import { ADMIN_COOKIE_NAME, sessionSecretFromEnv, verifyAdminSession } from "@/lib/admin/session-token";
import {
  PREVIEW_COOKIE_NAME,
  isPreviewFeatureEnabled,
  previewSecretFromEnv,
  verifyPreviewCookie,
} from "@/lib/preview-cookie";
import { jsonRateLimited } from "@/lib/rate-limit-response";
import { clientIp } from "@/lib/request-ip";
import {
  crmHostFromEnv,
  isAdminSurfacePath,
  isCrmHost,
  isCrmOnlyPath,
  isCrmPermittedPath,
  isDevHost,
  isHostSplitActive,
  isShopCriticalOpenPath,
  requestHostname,
} from "@/lib/host-routing";
import { SHOP_PREVIEW_PATH } from "@/lib/shop-base-path";
import { shopWebsitedxOrigin } from "@/lib/shop-preview-url";

const ADMIN_PUBLIC_API = new Set(["/api/admin/login", "/api/admin/logout", "/api/admin/totp"]);

/** Doit rester aligné sur le tableau littéral `config.matcher` de `proxy.ts` (analyse statique Turbopack). */
export const PROXY_MATCHER = ["/", "/((?!_next/static|_next/image|favicon.ico).*)"] as const;

const GATE_DENY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
} as const;

const HOST_STEALTH_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

const HOST_STEALTH_HTML =
  "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\"><title>404</title></head><body><p>Not found.</p></body></html>";

function hostIsolationDenied(pathname: string): NextResponse {
  if (pathname.startsWith("/api/")) {
    return jsonNoStore({ error: "Not found." }, { status: 404, headers: HOST_STEALTH_HEADERS });
  }
  return new NextResponse(HOST_STEALTH_HTML, {
    status: 404,
    headers: {
      ...HOST_STEALTH_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function shopAdminPageRedirectToCrm(request: NextRequest, pathname: string): NextResponse | null {
  const crmHost = crmHostFromEnv();
  if (!crmHost) return null;
  const target = new URL(`${pathname}${request.nextUrl.search}`, `https://${crmHost}`);
  const response = NextResponse.redirect(target, 308);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function isShopPublicSurfacePath(pathname: string): boolean {
  if (pathname === SHOP_PREVIEW_PATH || pathname.startsWith(`${SHOP_PREVIEW_PATH}/`)) return true;
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return true;
  return false;
}

/** Host CRM : vitrine/checkout → www (évite « Not found » sur crm…/websitedx). */
function crmShopPathRedirectToWww(request: NextRequest, pathname: string): NextResponse | null {
  if (!isShopPublicSurfacePath(pathname)) return null;
  const origin = shopWebsitedxOrigin();
  const target = new URL(`${pathname}${request.nextUrl.search}`, origin);
  const response = NextResponse.redirect(target, 308);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

/** Équivalent du catch-all `proxy.ts` (hors assets Next statiques). */
export function pathMatchesProxyMatcher(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/_next/static") || pathname.startsWith("/_next/image")) return false;
  if (pathname === "/favicon.ico") return false;
  return true;
}

function applyHostSplitIsolation(request: NextRequest, pathname: string): NextResponse | null {
  if (!isHostSplitActive()) return null;

  const hostname = requestHostname(request);

  if (isCrmHost(hostname)) {
    const shopRedirect = crmShopPathRedirectToWww(request, pathname);
    if (shopRedirect) return shopRedirect;
    if (!isCrmPermittedPath(pathname)) return hostIsolationDenied(pathname);
    return null;
  }

  if (!isDevHost(hostname)) {
    if (!isShopCriticalOpenPath(pathname) && isCrmOnlyPath(pathname)) {
      if (isAdminSurfacePath(pathname) && !pathname.startsWith("/api/")) {
        const redirect = shopAdminPageRedirectToCrm(request, pathname);
        if (redirect) return redirect;
      }
      return hostIsolationDenied(pathname);
    }
  }

  return null;
}

function adminDenied(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return jsonNoStore({ error: "Non autorisé." }, { status: 401, headers: GATE_DENY_HEADERS });
  }
  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

const CHECKOUT_CAPTURE_MAX_BODY = 32_000;

/** Seul `intent: capture` (retour PayPal) — quote/create restent derrière le gate. */
async function isCheckoutCaptureRequest(request: NextRequest): Promise<boolean> {
  if (request.nextUrl.pathname !== "/api/checkout" || request.method !== "POST") return false;
  try {
    const raw = await request.clone().text();
    if (Buffer.byteLength(raw, "utf8") === 0 || Buffer.byteLength(raw, "utf8") > CHECKOUT_CAPTURE_MAX_BODY) {
      return false;
    }
    const body = JSON.parse(raw) as { intent?: unknown };
    return body.intent === "capture";
  } catch {
    return false;
  }
}

function teaserDenied(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return jsonNoStore({ error: "Non autorisé." }, { status: 401, headers: GATE_DENY_HEADERS });
  }
  const loginUrl = new URL("/admin", request.url);
  const nextTarget = search ? `${pathname}${search}` : pathname;
  loginUrl.searchParams.set("next", nextTarget);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const secret = sessionSecretFromEnv();
  if (!secret) return false;
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  return verifyAdminSession(token, secret);
}

async function hasValidPreviewCookie(request: NextRequest): Promise<boolean> {
  if (!isPreviewFeatureEnabled()) return false;
  const secret = previewSecretFromEnv();
  if (!secret) return false;
  const token = request.cookies.get(PREVIEW_COOKIE_NAME)?.value ?? "";
  return verifyPreviewCookie(token, secret);
}

/** Logique proxy Next 16 — testable (admin inchangé + gate teaser). */
export async function handleProxyRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (!pathMatchesProxyMatcher(pathname)) {
    return NextResponse.next();
  }

  const hostDenied = applyHostSplitIsolation(request, pathname);
  if (hostDenied) return hostDenied;

  if (pathname === "/admin" || pathname === "/admin/") return NextResponse.next();
  if (ADMIN_PUBLIC_API.has(pathname)) return NextResponse.next();
  if (request.method === "POST" && isEdgeWriteRateLimitPath(pathname)) {
    const gate = await limitEdgeApiWrite(pathname, clientIp(request));
    if (!gate.ok) {
      if (gate.status === 429) {
        return jsonRateLimited(gate.error, gate.retryAfter, {
          limit: gate.limit,
          remaining: gate.remaining,
        });
      }
      return jsonNoStore({ error: gate.error }, { status: gate.status, headers: GATE_DENY_HEADERS });
    }
  }


  const isAdminRoute = pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");

  if (isAdminRoute) {
    const secret = sessionSecretFromEnv();
    if (!secret) {
      if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
        return adminDenied(request);
      }
      return NextResponse.next();
    }
    if (await hasValidAdminSession(request)) return NextResponse.next();
    return adminDenied(request);
  }

  if (!isTeaserGateActive() || !isTeaserGatedPath(pathname)) {
    return NextResponse.next();
  }

  if (isTeaserGatePublicReturnPath(pathname)) return NextResponse.next();
  if (await isCheckoutCaptureRequest(request)) return NextResponse.next();

  if (await hasValidAdminSession(request)) return NextResponse.next();
  if (await hasValidPreviewCookie(request)) return NextResponse.next();
  return teaserDenied(request);
}
