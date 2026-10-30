"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";

export type PayPalCartLine = {
  productId: number;
  size: string;
  qty: number;
  personalization?: string;
};

type PayPalPaymentButtonProps = {
  lines: PayPalCartLine[];
  onApproved: (orderId: string) => void | Promise<void>;
  disabled?: boolean;
};

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ?? "";

const paypalOptions = {
  clientId: paypalClientId,
  currency: "EUR",
  intent: "capture",
  locale: "fr_FR",
  components: "buttons",
  enableFunding: "card",
  disableFunding: "paylater,venmo,credit",
};

export function PayPalPaymentButton({ lines, onApproved, disabled = false }: PayPalPaymentButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const signature = lines
    .map((line) => `${line.productId}:${line.size}:${line.qty}:${line.personalization ?? ""}`)
    .join("|");

  if (!paypalClientId) {
    return (
      <p className="text-center text-[11px] leading-relaxed tracking-wide text-white/50">
        Ajoute <span className="text-white/80">NEXT_PUBLIC_PAYPAL_CLIENT_ID</span> dans .env.local pour afficher PayPal.
      </p>
    );
  }

  if (lines.length === 0) return null;

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="relative overflow-hidden bg-white/[0.03] p-3">
        {processing ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0a]/85 backdrop-blur-sm">
            <p className="text-[10px] font-medium tracking-[0.28em] text-white/70 uppercase">Validation du paiement…</p>
          </div>
        ) : null}
        <div className={processing || disabled ? "pointer-events-none opacity-60" : undefined}>
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect", color: "gold", label: "paypal", tagline: false }}
            forceReRender={[signature]}
            createOrder={async () => {
              const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ intent: "create", lines }),
              });
              const payload = (await response.json().catch(() => null)) as { orderId?: string; error?: string } | null;
              if (!response.ok || !payload?.orderId) {
                const message = payload?.error ?? "La commande PayPal n'a pas pu être ouverte.";
                setError(message);
                throw new Error(message);
              }
              setError(null);
              return payload.orderId;
            }}
            onApprove={async (data) => {
              if (!data.orderID) {
                setError("La commande PayPal est introuvable.");
                return;
              }
              setProcessing(true);
              setError(null);
              try {
                await onApproved(data.orderID);
              } catch {
                setError("Le paiement PayPal n'a pas abouti.");
              } finally {
                setProcessing(false);
              }
            }}
            onCancel={() => setError("Paiement annulé.")}
            onError={() => setError("Le paiement PayPal n'a pas abouti.")}
          />
        </div>
      </div>
      {error ? <p className="mt-3 text-center text-[11px] tracking-wide text-white/55">{error}</p> : null}
    </PayPalScriptProvider>
  );
}
