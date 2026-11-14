"use client";

import { useEffect, useRef, useState } from "react";
import { formatClientCheckoutError } from "@/lib/checkout-diagnostic";
import {
  listenPayPalCheckoutPopup,
  openPayPalApprovalPopup,
  PAYPAL_CHECKOUT_MSG,
} from "@/lib/paypal-checkout-popup";

export type PayPalCartLine = {
  productId: number;
  size: string;
  qty: number;
  personalization?: string;
  selectedOption?: string;
};

type PayPalPaymentButtonProps = {
  lines: PayPalCartLine[];
  customerPhone: string;
  /** Jeton au clic « Payer », pas dans le rendu. */
  getTurnstileToken: () => string | null;
  /** `create` refusé : jeton Turnstile déjà consommé côté Cloudflare → renouveler le widget. */
  onAfterCreateFailure?: () => void;
  /** PayPal validé dans la fenêtre : finalisation capture côté checkout. */
  onApproved?: (orderId: string) => void;
  /** Fenêtre fermée sans payer. */
  onCancelled?: () => void;
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
  customerPhone,
  getTurnstileToken,
  onAfterCreateFailure,
  onApproved,
  onCancelled,
  disabled = false,
  tone = "dark",
}: PayPalPaymentButtonProps) {
  const isLight = tone === "light";
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);
  const busy = disabled || paying;

  function clearPopupPoll() {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    popupRef.current = null;
  }

  function endPayFlow() {
    clearPopupPoll();
    setPaying(false);
  }

  useEffect(() => {
    return listenPayPalCheckoutPopup((event) => {
      if (event.type === PAYPAL_CHECKOUT_MSG.approved) {
        endPayFlow();
        setError(null);
        onApproved?.(event.orderId);
        return;
      }
      if (event.type === PAYPAL_CHECKOUT_MSG.cancelled) {
        endPayFlow();
        setError(null);
        onCancelled?.();
      }
    });
  }, [onApproved, onCancelled]);

  useEffect(() => {
    return () => {
      clearPopupPoll();
    };
  }, []);

  async function startCheckout() {
    if (busy || lines.length === 0) return;
    setError(null);

    const turnstileToken = getTurnstileToken();
    if (!turnstileToken) {
      setError("Complétez la vérification Turnstile (case au-dessus) avant de payer.");
      return;
    }

    setPaying(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "create", token: turnstileToken, lines, customerPhone }),
      });
      const payload = (await response.json().catch(() => null)) as {
        approvalUrl?: string;
        orderId?: string;
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
        setPaying(false);
        return;
      }

      const popup = openPayPalApprovalPopup(payload.approvalUrl);
      if (!popup) {
        window.location.assign(payload.approvalUrl);
        return;
      }

      popupRef.current = popup;
      pollRef.current = window.setInterval(() => {
        if (!popupRef.current || popupRef.current.closed) {
          endPayFlow();
        }
      }, 400);
    } catch {
      setError("La commande PayPal n'a pas pu être ouverte.");
      onAfterCreateFailure?.();
      setPaying(false);
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
    <div className="relative">
      {paying ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0e1118]/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dingry-paypal-overlay-title"
        >
          <div
            className={`w-full max-w-md border p-6 shadow-xl ${
              isLight ? "border-[#e5e7eb] bg-white text-[#4b5563]" : "border-white/15 bg-[#0a0a0a] text-white"
            }`}
          >
            <p
              id="dingry-paypal-overlay-title"
              className="text-center text-[10px] tracking-[0.28em] uppercase text-[#9ca3af]"
            >
              Paiement sécurisé
            </p>
            <div className="mt-5 flex flex-col items-center gap-4">
              <Spinner light={isLight} />
              <p className="text-center text-sm leading-relaxed">
                Finalisez le paiement dans la fenêtre PayPal. Cette page DINGRY reste ouverte en arrière-plan.
              </p>
              <p className="text-center text-[10px] leading-relaxed tracking-wide text-[#9ca3af]">
                Fenêtre masquée ? Autorisez les pop-ups pour ce site, puis réessayez.
              </p>
            </div>
          </div>
        </div>
      ) : null}
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
          {paying ? <Spinner light /> : null}
          {paying ? "Paiement PayPal…" : "Payer avec PayPal"}
        </button>
      </div>
      <p
        className={`mt-3 text-center text-[10px] leading-relaxed tracking-wide ${
          isLight ? "text-[#0e1118]/45" : "text-white/40"
        }`}
      >
        PayPal s&apos;ouvre dans une fenêtre sécurisée : vous restez sur dingry.com pendant le paiement.
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