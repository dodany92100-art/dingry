"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { parsePayPalCapture, type PayPalPaymentResult } from "@/lib/paypal-order";
import { useState } from "react";

export type PayPalCartLine = {
  name: string;
  quantity: number;
  unitAmount: number;
};

export type { PayPalPaymentResult };

type PayPalPaymentButtonProps = {
  lines: PayPalCartLine[];
  onPaid: (result: PayPalPaymentResult) => void | Promise<void>;
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

function euros(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function PayPalPaymentButton({ lines, onPaid, disabled = false }: PayPalPaymentButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const signature = lines.map((line) => `${line.name}:${line.quantity}:${line.unitAmount}`).join("|");

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
            createOrder={(_data, actions) => {
              const priced = lines.map((line) => {
                const unitCents = Math.round(line.unitAmount * 100);
                const quantity = Math.max(1, Math.min(99, Math.round(line.quantity)));
                return { line, unitCents, quantity, lineCents: unitCents * quantity };
              });
              const totalCents = priced.reduce((sum, item) => sum + item.lineCents, 0);
              const currency = "EUR" as const;
              const total = euros(totalCents);

              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: currency,
                      value: total,
                      breakdown: {
                        item_total: { currency_code: currency, value: total },
                      },
                    },
                    items: priced.map(({ line, unitCents, quantity }) => ({
                      name: line.name.slice(0, 127),
                      quantity: String(quantity),
                      category: "PHYSICAL_GOODS",
                      unit_amount: { currency_code: currency, value: euros(unitCents) },
                    })),
                  },
                ],
                application_context: {
                  brand_name: "DINGRY",
                  shipping_preference: "GET_FROM_FILE",
                  user_action: "PAY_NOW",
                },
              });
            }}
            onApprove={async (data, actions) => {
              if (!actions.order) {
                setError("La capture PayPal est indisponible.");
                return;
              }
              setProcessing(true);
              setError(null);
              try {
                const details = await actions.order.capture();
                if (details.status !== "COMPLETED") {
                  setError("Le paiement PayPal n'est pas confirmé.");
                  return;
                }
                const result = parsePayPalCapture(details, data.orderID);
                if (result.total <= 0) {
                  setError("Montant de commande invalide.");
                  return;
                }
                await onPaid(result);
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
