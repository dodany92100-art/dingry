"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useState } from "react";

type TestStatus = "idle" | "success" | "error";

function formatTurnstileError(err: unknown): string {
  if (typeof err === "string") return err;
  if (typeof err === "number") return String(err);
  if (err === undefined || err === null) return "inconnu";
  return String(err);
}

/** Composant temporaire — activer via `NEXT_PUBLIC_DINGRY_TURNSTILE_PRODUCT_TEST=1`. */
export function ProductCaptchaTest() {
  const [status, setStatus] = useState<TestStatus>("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  const resetToken = useCallback(() => {
    setStatus("idle");
    setErrorCode(null);
    setTokenPreview(null);
  }, []);

  if (!siteKey) {
    return (
      <div className="my-4 rounded-md border border-rose-500/40 bg-rose-950/40 p-4 text-[12px] leading-relaxed text-rose-200">
        Variable <code className="text-rose-100">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> absente du build.
      </div>
    );
  }

  return (
    <div className="my-6 rounded-xl border border-white/10 bg-[#0c0c0c] p-4">
      <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
        Test anti-bot (Turnstile)
      </h4>
      <p className="mb-3 text-[11px] leading-relaxed text-white/40">
        Diagnostic temporaire · domaine + clé publique · aucun envoi serveur.
      </p>

      <div className="overflow-x-auto border border-white/10 bg-[#050505] p-3">
        <Turnstile
          siteKey={siteKey}
          onSuccess={(token) => {
            const preview = token.length > 24 ? `${token.slice(0, 12)}…${token.slice(-8)}` : token;
            console.info("[Turnstile OK] Jeton généré :", token);
            setStatus("success");
            setErrorCode(null);
            setTokenPreview(preview);
          }}
          onError={(err) => {
            const code = formatTurnstileError(err);
            console.error("[Turnstile Error]", code);
            setStatus("error");
            setErrorCode(code);
            setTokenPreview(null);
          }}
          onExpire={() => {
            console.warn("[Turnstile Expired] Jeton expiré.");
            resetToken();
          }}
          options={{
            theme: "dark",
            size: "flexible",
            language: "fr",
            action: "product-test",
            appearance: "always",
            retry: "auto",
          }}
        />
      </div>

      {status === "success" ? (
        <div className="mt-3 space-y-2">
          <p className="text-[12px] font-medium text-emerald-300">Domaine autorisé et clé valide (widget client).</p>
          {tokenPreview ? (
            <p className="font-mono text-[10px] text-white/35" aria-live="polite">
              Jeton (extrait) : {tokenPreview}
            </p>
          ) : null}
          <button
            type="button"
            className="min-h-[44px] w-full border border-emerald-400/50 bg-emerald-500/15 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100"
          >
            Confirmation test OK
          </button>
        </div>
      ) : null}

      {status === "error" ? (
        <p className="mt-3 text-[12px] font-medium text-rose-300" role="alert">
          Échec de la vérification (code : {errorCode ?? "inconnu"})
        </p>
      ) : null}
    </div>
  );
}

/** Afficher le bloc de test Turnstile sur la fiche produit (t-shirts). */
export function isTurnstileProductTestEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DINGRY_TURNSTILE_PRODUCT_TEST?.trim() === "1";
}
