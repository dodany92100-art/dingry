import { cookies } from "next/headers";
import { jsonNoStore } from "@/lib/http";
import {
  ADMIN_COOKIE_NAME,
  sessionSecretFromEnv,
  sessionTtlSeconds,
  signAdminSession,
  verifyAdminSession,
} from "@/lib/admin/session-token";

export { ADMIN_COOKIE_NAME };

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = sessionSecretFromEnv();
  if (!secret) return false;
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE_NAME)?.value ?? "";
  return verifyAdminSession(value, secret);
}

export function adminCookieOptions(maxAge = sessionTtlSeconds()) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: cookieSecure(),
    path: "/",
    maxAge,
  };
}

export async function createAdminSessionResponse(body: unknown, status = 200) {
  const secret = sessionSecretFromEnv();
  if (!secret) {
    return jsonNoStore(
      { error: "Connexion indisponible : ADMIN_SESSION_SECRET (≥ 32 car.) ou ADMIN_TOTP_SECRET requis." },
      { status: 503 },
    );
  }
  const session = await signAdminSession(secret);
  const response = jsonNoStore(body, { status });
  response.cookies.set(ADMIN_COOKIE_NAME, session.token, adminCookieOptions(session.maxAge));
  return response;
}

export function clearAdminSessionResponse(body: unknown, status = 200) {
  const response = jsonNoStore(body, { status });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    ...adminCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    return jsonNoStore({ error: "Non autorisé." }, { status: 401 });
  }
  return null;
}

export { isBlobConfigured } from "@/lib/admin/blob-config";
