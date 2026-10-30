import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  sessionTtlSeconds,
  signAdminSession,
  verifyAdminSession,
} from "@/lib/admin/session-token";
import { getTotpSecret } from "@/lib/admin/totp";

export { ADMIN_COOKIE_NAME };

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = await getTotpSecret();
  if (!secret) return false;
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE_NAME)?.value ?? "";
  return verifyAdminSession(value, secret);
}

export function adminCookieOptions(maxAge = sessionTtlSeconds()) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function createAdminSessionResponse(body: unknown, status = 200): Promise<NextResponse> {
  const secret = await getTotpSecret();
  if (!secret) {
    return NextResponse.json({ error: "Connexion indisponible." }, { status: 503 });
  }
  const session = await signAdminSession(secret);
  const response = NextResponse.json(body, { status });
  response.cookies.set(ADMIN_COOKIE_NAME, session.token, adminCookieOptions(session.maxAge));
  return response;
}

export function clearAdminSessionResponse(body: unknown, status = 200): NextResponse {
  const response = NextResponse.json(body, { status });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    ...adminCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export async function requireAdmin(): Promise<NextResponse | null> {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return null;
}

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
