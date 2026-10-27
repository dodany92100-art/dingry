import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getTotpSecret } from "@/lib/admin/totp";

export const ADMIN_COOKIE_NAME = "dingry_admin";

const SESSION_PAYLOAD = "dingry-admin-session-v2-totp";

async function sessionToken(): Promise<string> {
  const secret = await getTotpSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(SESSION_PAYLOAD).digest("hex");
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length === 0 || a.length !== b.length) {
    const dummy = Buffer.alloc(32);
    timingSafeEqual(dummy, dummy);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const expected = await sessionToken();
  if (!expected) return false;
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!value) return false;
  return safeEqual(value, expected);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function createAdminSessionResponse(body: unknown, status = 200): Promise<NextResponse> {
  const response = NextResponse.json(body, { status });
  response.cookies.set(ADMIN_COOKIE_NAME, await sessionToken(), adminCookieOptions());
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
