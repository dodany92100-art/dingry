import { NextResponse, type NextRequest } from "next/server";
import { jsonNoStore } from "@/lib/http";
import { isTeaserGateActive, isTeaserGatedPath } from "@/lib/dingry-teaser-gate";
import { ADMIN_COOKIE_NAME, sessionSecretFromEnv, verifyAdminSession } from "@/lib/admin/session-token";

const ADMIN_PUBLIC_API = new Set(["/api/admin/login", "/api/admin/logout", "/api/admin/totp"]);

/** Doit rester aligné sur le tableau littéral `config.matcher` de `proxy.ts` (analyse statique Turbopack). */
export const PROXY_MATCHER = [
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
  "/api/banners",
  "/api/catalog-perso-banner",
] as const;

const GATE_DENY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
} as const;

/** Aligné sur les motifs `config.matcher` du proxy (sans invoquer Next). */
export function pathMatchesProxyMatcher(pathname: string): boolean {
  for (const pattern of PROXY_MATCHER) {
    if (pattern.endsWith("/:path*")) {
      const base = pattern.slice(0, pattern.length - "/:path*".length);
      if (pathname === base || pathname.startsWith(`${base}/`)) return true;
      continue;
    }
    if (pathname === pattern) return true;
  }
  return false;
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

function teaserDenied(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return jsonNoStore({ error: "Non autorisé." }, { status: 401, headers: GATE_DENY_HEADERS });
  }
  const loginUrl = new URL("/admin", request.url);
  loginUrl.searchParams.set("next", pathname);
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

  if (pathname === "/admin" || pathname === "/admin/") return NextResponse.next();
  if (ADMIN_PUBLIC_API.has(pathname)) return NextResponse.next();

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

  if (await hasValidAdminSession(request)) return NextResponse.next();
  return teaserDenied(request);
}
