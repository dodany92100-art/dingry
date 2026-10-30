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

function Spinner() {
  return <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-white" aria-hidden />;
}

export function PayPalPaymentButton({ lines, onApproved, disabled = false }: PayPalPaymentButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [phase, setPhase] = useState<"idle" | "opening" | "capturing">("idle");
  const signature = lines
    .map((line) => `${line.productId}:${line.size}:${line.qty}:${line.personalization ?? ""}`)
    .join("|");
  const busy = phase !== "idle" || disabled;

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
      <PayPalScriptProvider options={paypalOptions}>
        <div className="relative border border-white/10 bg-[#0a0a0a] p-4">
          {phase !== "idle" ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]/95 px-6 text-center">
              <Spinner />
              <p className="text-[11px] font-medium tracking-[0.18em] text-white uppercase">
                {phase === "capturing" ? "Validation du paiement…" : "Ouverture de PayPal…"}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-white/60">
                {phase === "opening"
                  ? "Une fenêtre PayPal s’ouvre par-dessus DINGRY. Fermez-la pour revenir au paiement."
                  : "Ne fermez pas cet onglet."}
              </p>
              {phase === "opening" ? (
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  className="text-[10px] tracking-[0.16em] text-white/70 uppercase underline"
                >
                  Revenir au paiement
                </button>
              ) : null}
            </div>
          ) : null}
          <div className={busy ? "pointer-events-none opacity-50" : undefined}>
            <PayPalButtons
              style={{ layout: "vertical", shape: "rect", color: "gold", label: "paypal", height: 46, tagline: false }}
              forceReRender={[signature]}
              disabled={disabled}
              createOrder={async () => {
                setPhase("opening");
                setError(null);
                setCancelled(false);
                try {
                  const response = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ intent: "create", lines }),
                  });
                  const payload = (await response.json().catch(() => null)) as { orderId?: string; error?: string } | null;
                  if (!response.ok || !payload?.orderId) {
                    const message = payload?.error ?? "La commande PayPal n'a pas pu être ouverte.";
                    setError(message);
                    setPhase("idle");
                    throw new Error(message);
                  }
                  return payload.orderId;
                } catch (cause) {
                  setPhase("idle");
                  if (cause instanceof Error && cause.message) throw cause;
                  const message = "La commande PayPal n'a pas pu être ouverte.";
                  setError(message);
                  throw new Error(message);
                }
              }}
              onApprove={async (data) => {
                if (!data.orderID) {
                  setPhase("idle");
                  setError("La commande PayPal est introuvable.");
                  return;
                }
                setPhase("capturing");
                setError(null);
                setCancelled(false);
                try {
                  await onApproved(data.orderID);
                } catch {
                  setError("Le paiement PayPal n'a pas abouti. Vous pouvez réessayer.");
                } finally {
                  setPhase("idle");
                }
              }}
              onCancel={() => {
                setPhase("idle");
                setError(null);
                setCancelled(true);
              }}
              onError={() => {
                setPhase("idle");
                setCancelled(false);
                setError("Le paiement PayPal n'a pas abouti. Vous pouvez réessayer sans quitter la page.");
              }}
            />
          </div>
        </div>
      </PayPalScriptProvider>
      <p className="mt-3 text-center text-[10px] leading-relaxed tracking-wide text-white/40">
        PayPal reste dans une fenêtre. DINGRY ne quitte pas votre écran.
      </p>
      {cancelled ? (
        <div className="mt-3 border border-white/15 bg-white/[0.03] px-4 py-3 text-center" role="status">
          <p className="text-sm text-white">Paiement annulé.</p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Vous êtes toujours sur DINGRY. Le panier est intact : relancez PayPal quand vous voulez.
          </p>
        </div>
      ) : null}
      {error ? (
        <p className="mt-3 text-center text-[11px] leading-relaxed text-[#ffb4b4]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
