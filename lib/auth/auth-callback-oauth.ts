import type { AuthError, EmailOtpType, Session, SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_EMAIL_OTP_TYPES = new Set<string>(["email", "signup", "magiclink"]);

export type AllowedEmailOtpType = "email" | "signup" | "magiclink";

export type AuthCallbackUrlScan = {
  oauthError: string | null;
  hasImplicitTokens: boolean;
  hasCode: boolean;
  code: string | null;
  hasTokenHash: boolean;
  tokenHash: string | null;
  otpType: string | null;
};

/** Détecte erreurs OAuth / hash implicit sans exposer de secrets. */
export function scanAuthCallbackUrl(search: string, hashRaw: string): AuthCallbackUrlScan {
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hashRaw);
  const oauthError =
    params.get("error") ??
    hashParams.get("error") ??
    params.get("error_description") ??
    hashParams.get("error_description");
  const hasImplicitTokens = /(?:^|&)(?:access_token|refresh_token)=/i.test(hashRaw);
  const code = params.get("code")?.trim() ?? null;
  const tokenHash = params.get("token_hash")?.trim() ?? null;
  const otpType = params.get("type")?.trim() ?? null;
  return {
    oauthError,
    hasImplicitTokens,
    hasCode: Boolean(code),
    code: code || null,
    hasTokenHash: Boolean(tokenHash),
    tokenHash: tokenHash || null,
    otpType,
  };
}

export function isAllowedEmailOtpType(type: string | null | undefined): type is AllowedEmailOtpType {
  if (!type) return false;
  return ALLOWED_EMAIL_OTP_TYPES.has(type);
}

export type AuthHandoffResult =
  | { ok: true; session: Session }
  | { ok: false; error: AuthError | null };

let inFlightExchange: { codeKey: string; promise: Promise<AuthHandoffResult> } | null = null;
let inFlightOtp: { otpKey: string; promise: Promise<AuthHandoffResult> } | null = null;

function handoffResult(
  data: { session: Session | null },
  error: AuthError | null,
): AuthHandoffResult {
  if (error) return { ok: false, error };
  if (!data.session) return { ok: false, error: null };
  return { ok: true, session: data.session };
}

/** Un seul `exchangeCodeForSession` par code dans le tab (StrictMode / double effet). */
export async function exchangePkceCodeOnce(client: SupabaseClient, code: string): Promise<AuthHandoffResult> {
  const codeKey = code;
  if (inFlightExchange?.codeKey === codeKey) {
    return inFlightExchange.promise;
  }
  const promise = client.auth
    .exchangeCodeForSession(code)
    .then(({ data, error }) => handoffResult(data, error));
  inFlightExchange = { codeKey, promise };
  void promise.finally(() => {
    if (inFlightExchange?.codeKey === codeKey) inFlightExchange = null;
  });
  return promise;
}

/** Un seul `verifyOtp` par token_hash + type (même verrou par promesse). */
export async function verifyEmailOtpOnce(
  client: SupabaseClient,
  tokenHash: string,
  type: AllowedEmailOtpType,
): Promise<AuthHandoffResult> {
  const otpKey = `${type}:${tokenHash}`;
  if (inFlightOtp?.otpKey === otpKey) {
    return inFlightOtp.promise;
  }
  const promise = client.auth
    .verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })
    .then(({ data, error }) => handoffResult(data, error));
  inFlightOtp = { otpKey, promise };
  void promise.finally(() => {
    if (inFlightOtp?.otpKey === otpKey) inFlightOtp = null;
  });
  return promise;
}

/** Vide les verrous (tests uniquement). */
export function resetAuthCallbackLocksForTests(): void {
  inFlightExchange = null;
  inFlightOtp = null;
}

/** @deprecated utilise resetAuthCallbackLocksForTests */
export function resetPkceExchangeLockForTests(): void {
  resetAuthCallbackLocksForTests();
}

export type AuthCallbackFailureLog = {
  message: string;
  errorName: string;
  errorCode: string | null;
};

export function authCallbackFailureFromError(error: AuthError | null): AuthCallbackFailureLog {
  if (!error) {
    return { message: "no_session", errorName: "no_session", errorCode: null };
  }
  return {
    message: error.message,
    errorName: error.name ?? "auth_error",
    errorCode: typeof error.code === "string" ? error.code : null,
  };
}

export function logAuthCallbackFailure(context: string, error: AuthError | null): void {
  const detail = authCallbackFailureFromError(error);
  console.error("[auth/callback]", context, {
    message: detail.message,
    errorName: detail.errorName,
    errorCode: detail.errorCode,
  });
}
