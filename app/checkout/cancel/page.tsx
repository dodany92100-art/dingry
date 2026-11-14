"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { notifyPayPalCheckoutOpener, PAYPAL_CHECKOUT_MSG } from "@/lib/paypal-checkout-popup";

export default function CheckoutCancelPage() {
  const [popupHandoff, setPopupHandoff] = useState(false);

  useEffect(() => {
    const notified = notifyPayPalCheckoutOpener({ type: PAYPAL_CHECKOUT_MSG.cancelled });
    if (notified) {
      setPopupHandoff(true);
      window.close();
    }
  }, []);

  if (popupHandoff) {
    return (
      <main className="dingry-checkout-page min-h-screen bg-[#f6f6f4] px-4 py-14 text-[#9ca3af]">
        <p className="text-center text-[11px] tracking-[0.22em] uppercase">Fermeture…</p>
      </main>
    );
  }

  return (
    <main className="dingry-checkout-page min-h-screen bg-[#f6f6f4] text-[#4b5563]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-8 md:px-6 md:py-14">
        <Link href="/" aria-label="Retour à la boutique DINGRY">
          <DingryLogo animate={false} tone="on-light" className="h-8 md:h-10" />
        </Link>

        <section className="dingry-checkout-pay-surface mt-10 border p-4 md:p-8" role="status">
          <p className="dingry-checkout-pay-eyebrow">Paiement</p>
          <h1 className="dingry-checkout-pay-title mt-4">Paiement annulé</h1>
          <p className="dingry-checkout-pay-lead mt-3">
            Aucun débit n’a été effectué. Votre panier DINGRY est intact.
          </p>
          <Link href="/checkout" className="dingry-checkout-pay-primary mt-8 block text-center">
            Reprendre le paiement
          </Link>
          <Link
            href="/"
            className="dingry-checkout-pay-secondary mt-4 block w-full border py-3 text-center text-[10px] tracking-[0.22em] uppercase"
          >
            Retour à la boutique
          </Link>
        </section>
      </div>
    </main>
  );
}