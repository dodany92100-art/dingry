import { clientIp } from "@/lib/request-ip";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type SiteverifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

export type TurnstileVerdict =
  | { ok: true }
  | { ok: false; status: 403 | 503; error: string };

export function turnstileTokenFromBody(value: unknown): string {
  if (!value || typeof value !== "object" || !("token" in value)) return "";
  const token = (value as { token: unknown }).token;
  return typeof token === "string" ? token.trim() : "";
}

export function turnstileRemoteIp(request: Request): string | undefined {
  const address = clientIp(request);
  if (address === "unknown") return undefined;
  return address;
}

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<TurnstileVerdict> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  if (!secret) {
    if (process.env.NODE_ENV === "development") return { ok: true };
    return { ok: false, status: 503, error: "Protection anti-bot indisponible." };
  }
  if (token === "developpement" && process.env.NODE_ENV !== "development") {
    return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
  }
  if (process.env.NODE_ENV === "development" && token === "developpement") {
    return { ok: true };
  }
  if (token.length < 10 || token.length > 2048) {
    return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
    }
    const data = (await response.json()) as SiteverifyResponse;
    if (data.success !== true) {
      console.error("Turnstile refusé", data["error-codes"] ?? []);
      return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
    }
    return { ok: true };
  } catch (error) {
    console.error("Turnstile injoignable", error instanceof Error ? error.message : "erreur");
    return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
  }
}
