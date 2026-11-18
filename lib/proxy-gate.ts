import { NextResponse, type NextRequest } from "next/server";
import { isEdgeWriteRateLimitPath, limitEdgeApiWrite } from "@/lib/edge-api-rate-limit";
import { jsonNoStore } from "@/lib/http";
import {
  isTeaserGateActive,
  isTeaserGatePublicReturnPath,
  isTeaserGatedPath,
} from "@/lib/dingry-teaser-gate";
import { ADMIN_COOKIE_NAME, sessionSecretFromEnv, verifyAdminSession } from "@/lib/admin/session-token";
import { jsonRateLimited } from "@/lib/rate-limit-response";
import { clientIp } from "@/lib/request-ip";
import {
  isCrmHost,
  isCrmOnlyPath,
  isCrmPermittedPath,
  isDevHost,
  isHostSplitActive,
  isShopCriticalOpenPath,
  requestHostname,
} from "@/lib/host-routing";

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

function hostIsolationDenied(): NextResponse {
  return new NextResponse(null, { status: 404, headers: HOST_STEALTH_HEADERS });
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
    if (!isCrmPermittedPath(pathname)) return hostIsolationDenied();
    return null;
  }

  if (!isDevHost(hostname)) {
    if (!isShopCriticalOpenPath(pathname) && isCrmOnlyPath(pathname)) {
      return hostIsolationDenied();
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
  return teaserDenied(request);
}
