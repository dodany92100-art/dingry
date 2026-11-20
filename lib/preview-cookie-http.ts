import {
  PREVIEW_COOKIE_NAME,
  PREVIEW_TTL_SECONDS,
  previewSecretFromEnv,
  signPreviewCookie,
} from "@/lib/preview-cookie";
import { jsonNoStore } from "@/lib/http";

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

import { dingrySharedCookieDomain } from "@/lib/dingry-cookie-domain";

export function previewCookieDomain(): string | undefined {
  return dingrySharedCookieDomain();
}

export function previewCookieBaseOptions() {
  const domain = previewCookieDomain();
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

export async function setPreviewCookieOnResponse<T>(body: T, status = 200) {
  const secret = previewSecretFromEnv();
  if (!secret) {
    return jsonNoStore({ error: "Preview non configurée." }, { status: 503 });
  }
  const { token, maxAge } = await signPreviewCookie(secret);
  const response = jsonNoStore(body, { status });
  response.cookies.set(PREVIEW_COOKIE_NAME, token, {
    ...previewCookieBaseOptions(),
    maxAge,
  });
  return response;
}

export function clearPreviewCookieResponse<T>(body: T, status = 200) {
  const response = jsonNoStore(body, { status });
  response.cookies.set(PREVIEW_COOKIE_NAME, "", {
    ...previewCookieBaseOptions(),
    maxAge: 0,
  });
  return response;
}

export { PREVIEW_COOKIE_NAME, PREVIEW_TTL_SECONDS };