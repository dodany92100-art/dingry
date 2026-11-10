"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import {
  clearPendingCheckoutOrder,
  readStoredCart,
  saveCheckoutConfirmation,
  savePendingCheckoutOrder,
  writeStoredCart,
  type CheckoutConfirmation,
} from "@/lib/checkout-draft";
import { PAYPAL_ORDER_FINALIZING_MESSAGE } from "@/lib/paypal-messages";
import { isPayPalOrderId } from "@/lib/paypal-order-id";

function eurosFromTotal(total: number): string {
  const cents = Math.round(total * 100);
  const whole = Math.trunc(cents / 100);
  const fraction = String(Math.abs(cents % 100)).padStart(2, "0");
  return `${whole},${fraction} €`;
}

function CheckoutSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retryTimerRef = useRef<number | null>(null);
  const [confirmation, setConfirmation] = useState<CheckoutConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(true);

  const orderId = (searchParams.get("token") ?? "").trim();

  useEffect(() => {
    return () => {
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isPayPalOrderId(orderId)) {
      setSaving(false);
      setError("Référence PayPal invalide ou absente.");
      return;
    }

    let cancelled = false;

    async function capture(attempt = 0): Promise<void> {
      if (cancelled) return;
      if (attempt === 0) setError(null);
      setSaving(true);
      let scheduledRetry = false;

      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: "capture", orderId }),
        });
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          order?: CheckoutConfirmation;
        } | null;
        const retryAfterHeader = Number(response.headers.get("Retry-After") ?? "0");
        const finalizing =
          response.status === 503 && payload?.error === PAYPAL_ORDER_FINALIZING_MESSAGE;

        if (response.ok && payload?.order) {
          if (readStoredCart().length > 0) writeStoredCart([]);
          saveCheckoutConfirmation(payload.order);
          clearPendingCheckoutOrder();
          setConfirmation(payload.order);
          setError(null);
          setSaving(false);
          return;
        }

        if (finalizing && attempt < 12) {
          scheduledRetry = true;
          savePendingCheckoutOrder(orderId);
          setError("Paiement reçu. Finalisation de votre commande…");
          const waitMs = Math.max(1, retryAfterHeader || 3) * 1000;
          if (retryTimerRef.current !== null) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = window.setTimeout(() => {
            retryTimerRef.current = null;
            void capture(attempt + 1);
          }, waitMs);
          return;
        }

        if (finalizing) {
          savePendingCheckoutOrder(orderId);
          setError(
            "Paiement reçu. Votre confirmation arrivera par e-mail dès que la commande sera enregistrée.",
          );
          setSaving(false);
          return;
        }

        if (response.status !== 400 && response.status !== 409) {
          savePendingCheckoutOrder(orderId);
        }
        setError(payload?.error ?? "La commande n'a pas pu être enregistrée.");
        setSaving(false);
      } catch {
        savePendingCheckoutOrder(orderId);
        setError(
          `Réseau indisponible. Réessayez depuis le paiement ou contactez-nous avec la référence ${orderId}.`,
        );
        setSaving(false);
      } finally {
        if (!scheduledRetry && !cancelled) setSaving(false);
      }
    }

    void capture();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <main className="dingry-checkout-page min-h-screen bg-[#f6f6f4] text-[#4b5563]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-8 md:px-6 md:py-14">
        <Link href="/" aria-label="Retour à la boutique DINGRY">
          <DingryLogo animate={false} className="h-8 md:h-10" />
        </Link>

        <section className="dingry-checkout-pay-surface mt-10 border p-4 md:p-8">
          {saving && !confirmation ? (
            <>
              <p className="dingry-checkout-pay-eyebrow">Paiement</p>
              <h1 className="dingry-checkout-pay-title mt-4">Finalisation…</h1>
              <p className="dingry-checkout-pay-lead mt-3 flex items-center gap-3">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-[#d1d5db] border-t-[#6b7280]"
                  aria-hidden
                />
                Validation de votre commande PayPal. Ne fermez pas cette page.
              </p>
            </>
          ) : confirmation ? (
            <>
              <p className="dingry-checkout-pay-eyebrow">Commande confirmée</p>
              <h1 className="dingry-checkout-pay-title mt-4">Merci {confirmation.payerName}.</h1>
              <p className="dingry-checkout-pay-lead mt-3">
                PayPal vous envoie le reçu. DINGRY prépare l’expédition.
              </p>
              <p className="mt-6 text-[10px] tracking-[0.22em] text-[#9ca3af] uppercase">Réf. {confirmation.orderId}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#6b7280]">
                {confirmation.items.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="dingry-product-price dingry-product-price--on-light mt-6">
                {eurosFromTotal(confirmation.total)}
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="dingry-checkout-pay-primary mt-8"
              >
                Retour à la boutique
              </button>
            </>
          ) : (
            <>
              <p className="dingry-checkout-pay-eyebrow">Paiement</p>
              <h1 className="dingry-checkout-pay-title mt-4">Enregistrement incomplet</h1>
              <p className="dingry-checkout-pay-lead mt-3" role="alert">
                {error ?? "Impossible de finaliser la commande."}
              </p>
              {isPayPalOrderId(orderId) ? (
                <p className="mt-4 text-[10px] tracking-[0.22em] text-[#9ca3af] uppercase">Réf. {orderId}</p>
              ) : null}
              <Link
                href="/checkout"
                className="dingry-checkout-pay-secondary mt-8 block w-full border py-4 text-center text-[11px] font-medium tracking-[0.28em] uppercase"
              >
                Retour au paiement
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="dingry-checkout-page min-h-screen bg-[#f6f6f4] px-4 py-14 text-[#9ca3af]">
          <p className="text-[11px] tracking-[0.22em] uppercase">Chargement…</p>
        </main>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  );
}
