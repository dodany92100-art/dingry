"use client";

import { Suspense, useEffect, useState } from "react";
import type { AuthHandoffResult } from "@/lib/auth/auth-callback-oauth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { sanitizeAuthCallbackNext } from "@/lib/auth/auth-callback-next";
import {
  exchangePkceCodeOnce,
  isAllowedEmailOtpType,
  logAuthCallbackFailure,
  scanAuthCallbackUrl,
  verifyEmailOtpOnce,
} from "@/lib/auth/auth-callback-oauth";
import { SHOP_PREVIEW_PATH } from "@/lib/shop-base-path";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

function AuthCallbackLoading() {
  return (
    <p className="flex items-center gap-3 text-[11px] tracking-[0.2em] text-white/50 uppercase">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white" aria-hidden />
      Connexion…
    </p>
  );
}

const AUTH_CALLBACK_WAIT_MS = 6000;

function stripOAuthMaterialFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("code");
  url.searchParams.delete("token_hash");
  url.searchParams.delete("type");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  url.searchParams.delete("error_code");
  const clean = `${url.pathname}${url.search}`;
  window.history.replaceState(null, "", clean);
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [failed, setFailed] = useState(false);
  const nextPath = sanitizeAuthCallbackNext(searchParams.get("next"));

  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!client) {
      logAuthCallbackFailure("supabase_not_configured", null);
      stripOAuthMaterialFromUrl();
      setFailed(true);
      return;
    }

    let cancelled = false;
    let redirected = false;

    const markFailed = (context: string, error: Parameters<typeof logAuthCallbackFailure>[1] = null) => {
      if (cancelled || redirected) return;
      logAuthCallbackFailure(context, error);
      stripOAuthMaterialFromUrl();
      setFailed(true);
    };

    const finishSuccess = () => {
      if (cancelled || redirected) return;
      redirected = true;
      stripOAuthMaterialFromUrl();
      router.replace(nextPath);
    };

    const hashRaw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const scan = scanAuthCallbackUrl(window.location.search, hashRaw);

    if (scan.oauthError || scan.hasImplicitTokens) {
      markFailed(scan.hasImplicitTokens ? "implicit_hash_rejected" : "oauth_error_query");
      return;
    }

    const runHandoff = (handoff: Promise<AuthHandoffResult>, failContext: string) => {
      const { data: sub } = client.auth.onAuthStateChange((event, session) => {
        if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          finishSuccess();
        }
      });

      let settled = false;
      const settleFailure = (context: string, error: Parameters<typeof logAuthCallbackFailure>[1]) => {
        if (settled || cancelled || redirected) return;
        settled = true;
        markFailed(context, error);
      };

      void handoff.then((result) => {
        if (cancelled || redirected) return;
        if (result.ok) {
          settled = true;
          finishSuccess();
          return;
        }
        settleFailure(failContext, result.error);
      });

      const timeout = window.setTimeout(() => {
        if (settled || cancelled || redirected) return;
        void client.auth.getSession().then(({ data, error }) => {
          if (cancelled || redirected || settled) return;
          if (data.session) {
            settled = true;
            finishSuccess();
            return;
          }
          settleFailure("handoff_timeout", error ?? null);
        });
      }, AUTH_CALLBACK_WAIT_MS);

      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
        window.clearTimeout(timeout);
      };
    };

    if (scan.hasCode && scan.code) {
      return runHandoff(exchangePkceCodeOnce(client, scan.code), "exchange_code_for_session");
    }

    if (scan.hasTokenHash && scan.tokenHash) {
      if (!isAllowedEmailOtpType(scan.otpType)) {
        markFailed("otp_type_rejected", null);
        return;
      }
      return runHandoff(verifyEmailOtpOnce(client, scan.tokenHash, scan.otpType), "verify_email_otp");
    }

    void client.auth.getSession().then(({ data, error }) => {
      if (cancelled || redirected) return;
      if (error) {
        markFailed("get_session_without_handoff", error);
        return;
      }
      if (data.session) finishSuccess();
      else markFailed("get_session_without_handoff", null);
    });
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6 text-center text-white">
      {failed ? (
        <div>
          <p className="text-sm text-white/70">La connexion n’a pas abouti.</p>
          <Link href={SHOP_PREVIEW_PATH} className="mt-6 inline-block text-[10px] tracking-[0.22em] text-white/50 uppercase hover:text-white">
            Retour à la boutique
          </Link>
        </div>
      ) : (
        <AuthCallbackLoading />
      )}
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6 text-center text-white">
          <AuthCallbackLoading />
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
