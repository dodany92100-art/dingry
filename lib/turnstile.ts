import { clientIp } from "@/lib/request-ip";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const EXPECTED_ACTION = process.env.TURNSTILE_EXPECTED_ACTION?.trim() || "checkout";

type SiteverifyResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
  metadata?: { result_with_testing_key?: boolean };
};

export type TurnstileVerdict =
  | { ok: true }
  | { ok: false; status: 403 | 503; error: string };

/** Bypass Turnstile uniquement en `npm run dev` local — pas sur preview/prod Vercel. */
export function allowTurnstileDevBypass(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Liste explicite (virgules) : ex. `dingry.com,www.dingry.com`. Obligatoire en prod. */
export function turnstileExpectedHostnames(): string[] {
  const raw = process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function turnstileHostnameRequired(): boolean {
  return !allowTurnstileDevBypass();
}

export function turnstileHostnameConfigured(): boolean {
  if (allowTurnstileDevBypass()) return true;
  if (turnstileExpectedHostnames().length > 0) return true;
  if (process.env.VERCEL_ENV === "preview") {
    return Boolean(
      process.env.VERCEL_URL?.trim() || process.env.TURNSTILE_PREVIEW_HOST_SUFFIX?.trim(),
    );
  }
  return false;
}

/** Preview : `VERCEL_URL` ou suffixe projet (ex. `-days-projects-36e5dc27.vercel.app`). */
export function turnstileHostnameAllowed(hostname: string | undefined): boolean {
  if (!hostname) return false;
  const list = turnstileExpectedHostnames();
  if (list.includes(hostname)) return true;
  if (process.env.VERCEL_ENV === "preview") {
    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel && hostname === vercel) return true;
    const suffix = process.env.TURNSTILE_PREVIEW_HOST_SUFFIX?.trim();
    if (suffix && hostname.endsWith(suffix)) return true;
    /** Alias / déploiements Preview : hostname navigateur ≠ `VERCEL_URL` par deployment. */
    if (hostname.endsWith(".vercel.app")) return true;
  }
  return false;
}

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
    if (allowTurnstileDevBypass()) return { ok: true };
    return { ok: false, status: 503, error: "Protection anti-bot indisponible." };
  }
  if (turnstileHostnameRequired() && !turnstileHostnameConfigured()) {
    console.error("Turnstile hostname non configuré (TURNSTILE_EXPECTED_HOSTNAME ou preview VERCEL_URL)");
    return { ok: false, status: 503, error: "Protection anti-bot indisponible." };
  }
  if (token === "developpement") {
    if (allowTurnstileDevBypass()) return { ok: true };
    return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
  }
  if (token.length < 10 || token.length > 2048) {
    return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
  }

  const body = new URLSearchParams({ secret, response: token });
  /** IP forgeable / IPv6 vs IPv4 : ne pas envoyer `remoteip` sauf opt-in explicite. */
  if (process.env.TURNSTILE_SEND_REMOTE_IP === "1" && remoteIp) {
    body.set("remoteip", remoteIp);
  }

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
    const testingKey = data.metadata?.result_with_testing_key === true;
    if (!testingKey && data.action !== EXPECTED_ACTION) {
      console.error("Turnstile action refusée", data.action ?? "absent");
      return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
    }
    if (!testingKey && (turnstileExpectedHostnames().length > 0 || process.env.VERCEL_ENV === "preview")) {
      if (!turnstileHostnameAllowed(data.hostname)) {
        console.error("Turnstile hostname refusé", data.hostname ?? "absent");
        return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
      }
    }
    return { ok: true };
  } catch (error) {
    console.error("Turnstile injoignable", error instanceof Error ? error.name : "erreur");
    return { ok: false, status: 403, error: "Vérification anti-bot refusée." };
  }
}
