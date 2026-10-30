import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, sessionSecretFromEnv, verifyAdminSession } from "@/lib/admin/session-token";

const PUBLIC_API = new Set(["/api/admin/login", "/api/admin/logout", "/api/admin/totp"]);

function denied(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname === "/admin/") return NextResponse.next();
  if (PUBLIC_API.has(pathname)) return NextResponse.next();

  const secret = sessionSecretFromEnv();
  if (!secret) {
    if (process.env.NODE_ENV === "production") return denied(request);
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (await verifyAdminSession(token, secret)) return NextResponse.next();
  return denied(request);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
