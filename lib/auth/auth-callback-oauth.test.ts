import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AuthError, Session, SupabaseClient } from "@supabase/supabase-js";
import {
  authCallbackFailureFromError,
  exchangePkceCodeOnce,
  isAllowedEmailOtpType,
  logAuthCallbackFailure,
  resetAuthCallbackLocksForTests,
  scanAuthCallbackUrl,
  verifyEmailOtpOnce,
} from "@/lib/auth/auth-callback-oauth";

describe("scanAuthCallbackUrl", () => {
  it("détecte erreur query, tokens implicit et token_hash", () => {
    expect(scanAuthCallbackUrl("?error=access_denied", "").oauthError).toBe("access_denied");
    expect(scanAuthCallbackUrl("", "access_token=x&refresh_token=y").hasImplicitTokens).toBe(true);
    expect(scanAuthCallbackUrl("?code=uuid-here", "").hasCode).toBe(true);
    const magic = scanAuthCallbackUrl("?token_hash=secret-hash&type=magiclink", "");
    expect(magic.hasTokenHash).toBe(true);
    expect(magic.otpType).toBe("magiclink");
  });
});

describe("isAllowedEmailOtpType", () => {
  it("autorise email, signup, magiclink", () => {
    expect(isAllowedEmailOtpType("email")).toBe(true);
    expect(isAllowedEmailOtpType("signup")).toBe(true);
    expect(isAllowedEmailOtpType("magiclink")).toBe(true);
  });

  it("refuse recovery et types inconnus", () => {
    expect(isAllowedEmailOtpType("recovery")).toBe(false);
    expect(isAllowedEmailOtpType("email_change")).toBe(false);
    expect(isAllowedEmailOtpType("invite")).toBe(false);
    expect(isAllowedEmailOtpType(null)).toBe(false);
  });
});

describe("exchangePkceCodeOnce", () => {
  beforeEach(() => {
    resetAuthCallbackLocksForTests();
  });

  it("réussit avec session", async () => {
    const session = { access_token: "at" } as Session;
    const exchange = vi.fn().mockResolvedValue({ data: { session }, error: null });
    const client = { auth: { exchangeCodeForSession: exchange } } as unknown as SupabaseClient;

    const result = await exchangePkceCodeOnce(client, "code-1");
    expect(result.ok).toBe(true);
    expect(exchange).toHaveBeenCalledTimes(1);
  });

  it("n'appelle exchange qu'une fois si double appel (StrictMode)", async () => {
    let resolve!: (value: { data: { session: Session }; error: null }) => void;
    const pending = new Promise<{ data: { session: Session }; error: null }>((r) => {
      resolve = r;
    });
    const exchange = vi.fn().mockReturnValue(pending);
    const client = { auth: { exchangeCodeForSession: exchange } } as unknown as SupabaseClient;

    const first = exchangePkceCodeOnce(client, "same-code");
    const second = exchangePkceCodeOnce(client, "same-code");
    expect(exchange).toHaveBeenCalledTimes(1);

    resolve({ data: { session: { access_token: "x" } as Session }, error: null });
    const [a, b] = await Promise.all([first, second]);
    expect(a.ok && b.ok).toBe(true);
  });

  it("passe flowId à exchangeCodeForSession", async () => {
    const session = { access_token: "at" } as Session;
    const exchange = vi.fn().mockResolvedValue({ data: { session }, error: null });
    const client = { auth: { exchangeCodeForSession: exchange } } as unknown as SupabaseClient;

    await exchangePkceCodeOnce(client, "code-1", "flow-abcdef12");
    expect(exchange).toHaveBeenCalledWith("code-1", { flowId: "flow-abcdef12" });
  });
});

describe("verifyEmailOtpOnce", () => {
  beforeEach(() => {
    resetAuthCallbackLocksForTests();
  });

  it("lien magique (magiclink) avec session", async () => {
    const session = { access_token: "at" } as Session;
    const verifyOtp = vi.fn().mockResolvedValue({ data: { session }, error: null });
    const client = { auth: { verifyOtp } } as unknown as SupabaseClient;

    const result = await verifyEmailOtpOnce(client, "hash-magic", "magiclink");
    expect(result.ok).toBe(true);
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "hash-magic", type: "magiclink" });
  });

  it("confirmation inscription (signup) avec session", async () => {
    const session = { access_token: "at" } as Session;
    const verifyOtp = vi.fn().mockResolvedValue({ data: { session }, error: null });
    const client = { auth: { verifyOtp } } as unknown as SupabaseClient;

    const result = await verifyEmailOtpOnce(client, "hash-signup", "signup");
    expect(result.ok).toBe(true);
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "hash-signup", type: "signup" });
  });

  it("token_hash invalide", async () => {
    const error = { message: "invalid", name: "AuthApiError", code: "otp_expired" } as AuthError;
    const verifyOtp = vi.fn().mockResolvedValue({ data: { session: null }, error });
    const client = { auth: { verifyOtp } } as unknown as SupabaseClient;

    const result = await verifyEmailOtpOnce(client, "bad-hash", "email");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error?.code).toBe("otp_expired");
  });

  it("double appel avec la même valeur : une seule requête, même résultat", async () => {
    let resolve!: (value: { data: { session: Session }; error: null }) => void;
    const pending = new Promise<{ data: { session: Session }; error: null }>((r) => {
      resolve = r;
    });
    const verifyOtp = vi.fn().mockReturnValue(pending);
    const client = { auth: { verifyOtp } } as unknown as SupabaseClient;

    const first = verifyEmailOtpOnce(client, "same-hash", "email");
    const second = verifyEmailOtpOnce(client, "same-hash", "email");
    expect(verifyOtp).toHaveBeenCalledTimes(1);

    resolve({ data: { session: { access_token: "x" } as Session }, error: null });
    const [a, b] = await Promise.all([first, second]);
    expect(a.ok && b.ok).toBe(true);
  });
});

describe("authCallbackFailureFromError", () => {
  it("utilise errorName et n'inclut pas de secret", () => {
    const log = authCallbackFailureFromError({
      message: "State has already been used",
      name: "AuthApiError",
      code: "flow_state_already_used",
    } as AuthError);
    expect(log.errorName).toBe("AuthApiError");
    expect(log.errorCode).toBe("flow_state_already_used");
    const serialized = JSON.stringify(log);
    expect(serialized).not.toMatch(/access_token|refresh_token|code_verifier|token_hash/);
    expect(serialized).not.toContain("secret-hash");
  });

  it("les logs console.error ne contiennent pas token_hash (structure)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logAuthCallbackFailure("verify_email_otp", {
      message: "otp invalid",
      name: "AuthApiError",
      code: "otp_expired",
    } as AuthError);
    const logged = spy.mock.calls[0]?.[2];
    expect(JSON.stringify(logged)).not.toMatch(/token_hash/);
    expect(logged).toMatchObject({ errorName: "AuthApiError", errorCode: "otp_expired" });
    spy.mockRestore();
  });
});
