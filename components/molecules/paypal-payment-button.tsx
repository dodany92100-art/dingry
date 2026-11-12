"use client";

import { useState } from "react";
import { formatClientCheckoutError } from "@/lib/checkout-diagnostic";

export type PayPalCartLine = {
  productId: number;
  size: string;
  qty: number;
  personalization?: string;
  selectedOption?: string;
};

type PayPalPaymentButtonProps = {
  lines: PayPalCartLine[];
  /** Jeton au clic « Payer », pas dans le rendu. */
  getTurnstileToken: () => string | null;
  /** `create` refusé : jeton Turnstile déjà consommé côté Cloudflare → renouveler le widget. */
  onAfterCreateFailure?: () => void;
  disabled?: boolean;
  tone?: "dark" | "light";
};

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ?? "";

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`h-5 w-5 animate-spin rounded-full border-2 ${
        light ? "border-[#0e1118]/15 border-t-[#0e1118]" : "border-white/15 border-t-white"
      }`}
      aria-hidden
    />
  );
}

export function PayPalPaymentButton({
  lines,
  getTurnstileToken,
  onAfterCreateFailure,
  disabled = false,
  tone = "dark",
}: PayPalPaymentButtonProps) {
  const isLight = tone === "light";
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const busy = disabled || redirecting;

  async function startCheckout() {
    if (busy || lines.length === 0) return;
    setError(null);

    const turnstileToken = getTurnstileToken();
    if (!turnstileToken) {
      setError("Complétez la vérification Turnstile (case au-dessus) avant de payer.");
      return;
    }

    setRedirecting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "create", token: turnstileToken, lines }),
      });
      const payload = (await response.json().catch(() => null)) as {
        approvalUrl?: string;
        error?: string;
        code?: string;
      } | null;
      if (!response.ok || !payload?.approvalUrl) {
        const message = formatClientCheckoutError(
          payload?.error ?? "La commande PayPal n'a pas pu être ouverte.",
          payload?.code,
        );
        setError(message);
        onAfterCreateFailure?.();
        setRedirecting(false);
        return;
      }
      window.location.href = payload.approvalUrl;
    } catch {
      setError("La commande PayPal n'a pas pu être ouverte.");
      onAfterCreateFailure?.();
      setRedirecting(false);
    }
  }

  if (!paypalClientId) {
    return (
      <p className="text-center text-[11px] leading-relaxed tracking-wide text-white/50">
        Ajoute <span className="text-white/80">NEXT_PUBLIC_PAYPAL_CLIENT_ID</span> dans .env.local pour afficher PayPal.
      </p>
    );
  }

  if (lines.length === 0) return null;

  return (
    <div>
      <div
        className={`border p-4 ${isLight ? "border-[#0e1118]/10 bg-white" : "border-white/10 bg-[#0a0a0a]"}`}
      >
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void startCheckout();
          }}
          className={`flex w-full items-center justify-center gap-3 py-4 text-[11px] font-medium tracking-[0.28em] uppercase transition-colors disabled:cursor-not-allowed ${
            isLight
              ? "bg-[#ffc439] text-[#0e1118] hover:bg-[#f2ba36] disabled:bg-[#e5e7eb] disabled:text-[#9ca3af]"
              : "bg-[#ffc439] text-[#0e1118] hover:bg-[#f2ba36] disabled:bg-white/10 disabled:text-white/40"
          }`}
        >
          {redirecting ? <Spinner light /> : null}
          {redirecting ? "Redirection vers PayPal…" : "Payer avec PayPal"}
        </button>
      </div>
      <p
        className={`mt-3 text-center text-[10px] leading-relaxed tracking-wide ${
          isLight ? "text-[#0e1118]/45" : "text-white/40"
        }`}
      >
        Vous serez redirigé vers PayPal pour valider le paiement, puis renvoyé sur DINGRY.
      </p>
      {error ? (
        <p
          className={`mt-3 text-center text-[11px] leading-relaxed ${
            isLight ? "text-[#b91c1c]" : "text-[#ffb4b4]"
          }`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
