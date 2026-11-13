"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { sanitizeAuthCallbackNext } from "@/lib/auth/auth-callback-next";
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

function clearOAuthHashFromHistory() {
  if (typeof window === "undefined" || !window.location.hash) return;
  const path = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", path);
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [failed, setFailed] = useState(false);
  const nextPath = sanitizeAuthCallbackNext(searchParams.get("next"));

  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!client) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    let redirected = false;

    const finish = (sessionPresent: boolean) => {
      if (cancelled || redirected) return;
      if (sessionPresent) {
        redirected = true;
        clearOAuthHashFromHistory();
        router.replace(nextPath);
        return;
      }
      setFailed(true);
    };

    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has("code");
    const hasHash = /access_token=|refresh_token=|error=/i.test(window.location.hash);

    const checkSession = () =>
      client.auth.getSession().then(({ data }) => Boolean(data.session));

    if (!hasCode && !hasHash) {
      void checkSession().then((ok) => finish(ok));
      return () => {
        cancelled = true;
      };
    }

    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) finish(true);
    });

    void checkSession().then((ok) => {
      if (ok) finish(true);
    });

    const timeout = window.setTimeout(() => {
      void checkSession().then((ok) => finish(ok));
    }, AUTH_CALLBACK_WAIT_MS);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.clearTimeout(timeout);
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
