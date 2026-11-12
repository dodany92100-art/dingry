"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { sanitizeAuthCallbackNext } from "@/lib/auth/auth-callback-next";
import { SHOP_PREVIEW_PATH } from "@/lib/shop-base-path";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
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
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) setFailed(true);
          return;
        }
      }
      const { data } = await client.auth.getSession();
      if (!cancelled) {
        if (data.session) router.replace(nextPath);
        else setFailed(true);
      }
    })();
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
        <p className="flex items-center gap-3 text-[11px] tracking-[0.2em] text-white/50 uppercase">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white" aria-hidden />
          Connexion…
        </p>
      )}
    </main>
  );
}
