"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DingryLogo } from "@/components/dingry-logo";
import { PayPalPaymentButton } from "@/components/paypal-payment-button";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import {
  readStoredCart,
  saveCheckoutConfirmation,
  writeStoredCart,
  type CheckoutConfirmation,
  type StoredCartItem,
} from "@/lib/checkout-draft";
import { PAYPAL_ORDER_FINALIZING_MESSAGE } from "@/lib/paypal-messages";

type ServerQuote = {
  totalCents: number;
  lines: { label: string; size: string; qty: number; amountCents: number }[];
};

function euros(cents: number): string {
  const whole = Math.trunc(cents / 100);
  const fraction = String(Math.abs(cents % 100)).padStart(2, "0");
  return `${whole},${fraction} €`;
}

function orderLines(cart: StoredCartItem[]) {
  return cart.map((item) => ({
    productId: item.product.id,
    size: item.size,
    qty: item.qty,
    ...(item.personalization ? { personalization: item.personalization } : {}),
  }));
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<StoredCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<CheckoutConfirmation | null>(null);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [quoteState, setQuoteState] = useState<"loading" | "ready" | "error">("loading");
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  useEffect(() => {
    setCart(readStoredCart());
    setReady(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "dark");
    return () => {
      root.setAttribute("data-theme", previous ?? "light");
    };
  }, []);

  useEffect(() => {
    if (!ready || cart.length === 0) return;
    let cancelled = false;
    setQuoteState("loading");
    void (async () => {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: "quote", lines: orderLines(cart) }),
        });
        const payload = (await response.json().catch(() => null)) as (ServerQuote & { error?: string }) | null;
        const lines = payload?.lines;
        const valid =
          response.ok &&
          payload !== null &&
          typeof payload.totalCents === "number" &&
          Array.isArray(lines) &&
          lines.every(
            (line) =>
              line &&
              typeof line.label === "string" &&
              typeof line.size === "string" &&
              typeof line.qty === "number" &&
              typeof line.amountCents === "number",
          );
        if (!valid) {
          if (!cancelled) {
            setQuote(null);
            setQuoteState("error");
            setError(payload?.error ?? "Le total n'a pas pu être calculé.");
          }
          return;
        }
        if (!cancelled) {
          setQuote({ totalCents: payload.totalCents, lines });
          setQuoteState("ready");
        }
      } catch {
        if (!cancelled) {
          setQuote(null);
          setQuoteState("error");
          setError("Le total n'a pas pu être calculé.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, cart]);

  const canPay = Boolean(token) && !saving && !confirmation && quoteState === "ready" && quote !== null;

  async function registerOrder(orderId: string, turnstileToken: string, attempt = 0) {
    setSaving(true);
    if (attempt === 0) setError(null);
    let scheduledRetry = false;

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "capture",
          token: turnstileToken,
          orderId,
          lines: orderLines(cart),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; order?: CheckoutConfirmation } | null;
      const retryAfterHeader = Number(response.headers.get("Retry-After") ?? "0");
      const finalizing =
        response.status === 503 && payload?.error === PAYPAL_ORDER_FINALIZING_MESSAGE;

      if (response.ok && payload?.order) {
        writeStoredCart([]);
        saveCheckoutConfirmation(payload.order);
        setCart([]);
        setConfirmation(payload.order);
        setPendingOrderId(null);
        setError(null);
        return;
      }

      if (finalizing && attempt < 12) {
        scheduledRetry = true;
        setPendingOrderId(orderId);
        setError("Paiement reçu. Finalisation de votre commande…");
        const waitMs = Math.max(1, retryAfterHeader || 3) * 1000;
        window.setTimeout(() => {
          void registerOrder(orderId, turnstileToken, attempt + 1);
        }, waitMs);
        return;
      }

      if (finalizing) {
        setPendingOrderId(orderId);
        setError(
          "Paiement reçu. Votre confirmation arrivera par e-mail dès que la commande sera enregistrée. Vous pouvez fermer cette page.",
        );
        return;
      }

      setToken(null);
      setWidgetKey((key) => key + 1);
      setPendingOrderId(orderId);
      setError(payload?.error ?? "La commande n’a pas pu être enregistrée. Relancez la vérification.");
    } catch {
      setPendingOrderId(orderId);
      setError("Réseau indisponible. Le paiement PayPal est reçu : confirmez à nouveau pour enregistrer la commande.");
    } finally {
      if (!scheduledRetry) setSaving(false);
    }
  }

  async function handleApproved(orderId: string) {
    const current = tokenRef.current;
    if (!current) {
      setError("Confirmez la vérification avant de payer.");
      return;
    }
    await registerOrder(orderId, current);
  }

  function backToShop() {
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 md:px-6 md:py-14">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Retour à la boutique DINGRY">
            <DingryLogo animate={false} className="h-8 brightness-0 invert md:h-10" />
          </Link>
          <Link href="/" className="text-[10px] tracking-[0.22em] text-white/55 uppercase hover:text-white">
            Retour à la boutique
          </Link>
        </header>

        {!ready ? (
          <p className="text-[11px] tracking-[0.22em] text-white/40 uppercase">Chargement…</p>
        ) : confirmation ? (
          <section className="border border-white/10 bg-[#0a0a0a] p-4 md:p-8">
            <p className="text-[10px] tracking-[0.32em] text-[#0066FF] uppercase">Commande confirmée</p>
            <h1 className="mt-4 text-2xl font-medium tracking-tight">Merci {confirmation.payerName}.</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              PayPal vous envoie le reçu. DINGRY prépare l’expédition.
            </p>
            <p className="mt-6 text-[10px] tracking-[0.22em] text-white/35 uppercase">Réf. {confirmation.orderId}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {confirmation.items.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-6 text-lg font-medium">{confirmation.total}€</p>
            {confirmation.shippingAddress ? (
              <div className="mt-4 text-sm leading-relaxed text-white/50">
                <p>{confirmation.shippingName}</p>
                <p>{confirmation.shippingAddress}</p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={backToShop}
              className="mt-8 w-full bg-white py-4 text-[11px] font-medium tracking-[0.28em] text-[#050505] uppercase transition-colors hover:bg-[#0066FF] hover:text-white"
            >
              Retour à la boutique
            </button>
          </section>
        ) : cart.length === 0 ? (
          <section className="border border-white/10 bg-[#0a0a0a] p-4 md:p-8">
            <h1 className="text-2xl font-medium tracking-tight">Panier vide</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Ajoutez une pièce avant de passer au paiement.
            </p>
            <Link
              href="/"
              className="mt-8 block w-full bg-white py-4 text-center text-[11px] font-medium tracking-[0.28em] text-[#050505] uppercase transition-colors hover:bg-[#0066FF] hover:text-white"
            >
              Voir Dingry collection
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <section className="border border-white/10 bg-[#0a0a0a] p-4 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-[10px] tracking-[0.32em] text-white/40 uppercase">Votre commande</h1>
                <Link href="/?panier=1" className="text-[10px] tracking-[0.18em] text-[#0066FF] uppercase hover:text-white">
                  Modifier le panier
                </Link>
              </div>
              <ul className="mt-6 divide-y divide-white/[0.06]">
                {(quote?.lines ?? cart.map((item) => ({
                  label: item.product.name,
                  size: item.size,
                  qty: item.qty,
                  amountCents: 0,
                }))).map((line, index) => {
                  const item = cart[index];
                  return (
                    <li key={`${line.label}-${line.size}-${index}`} className="flex gap-4 py-4">
                      {item ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-20 w-16 bg-black object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm tracking-wide uppercase">{item?.product.name ?? line.label}</p>
                        {item?.product.variant ? (
                          <p className="mt-1 text-xs tracking-wider text-white/45 uppercase">{item.product.variant}</p>
                        ) : null}
                        {item?.personalization ? (
                          <p className="mt-1 text-xs tracking-wider text-[#0066FF] uppercase">« {item.personalization} »</p>
                        ) : null}
                        <p className="mt-1 text-xs text-white/40">Taille {line.size} · {line.qty}</p>
                      </div>
                      <p className="text-sm font-medium">
                        {quoteState === "ready" ? euros(line.amountCents) : "…"}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 flex items-baseline justify-between border-t border-white/[0.06] pt-5">
                <span className="text-[10px] tracking-[0.28em] text-white/40 uppercase">Total à payer</span>
                <span className="text-xl font-medium">
                  {quoteState === "ready" && quote ? euros(quote.totalCents) : quoteState === "error" ? "—" : "Calcul…"}
                </span>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed tracking-wide text-white/30">
                Montant calculé par DINGRY. La livraison est confirmée dans la fenêtre PayPal.
              </p>
            </section>

            <section className="border border-white/10 bg-[#0a0a0a] p-4 md:sticky md:top-6 md:p-8">
              <h2 className="text-[10px] tracking-[0.32em] text-white/40 uppercase">Paiement</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Vous restez sur DINGRY. PayPal s’ouvre dans une fenêtre, que vous pouvez fermer pour revenir ici.
              </p>
              <TurnstileWidget key={widgetKey} className="mt-6" onToken={setToken} />
              <div className="mt-6">
                {quoteState === "loading" ? (
                  <p className="flex items-center justify-center gap-3 py-4 text-[11px] tracking-[0.18em] text-white/45 uppercase">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" aria-hidden />
                    Calcul du total…
                  </p>
                ) : pendingOrderId ? (
                  <button
                    type="button"
                    disabled={!canPay}
                    onClick={() => {
                      if (pendingOrderId && token) void registerOrder(pendingOrderId, token);
                    }}
                    className="w-full bg-white py-4 text-[11px] font-medium tracking-[0.28em] text-[#050505] uppercase transition-colors hover:bg-[#0066FF] hover:text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
                  >
                    {saving ? "Enregistrement…" : "Confirmer la commande"}
                  </button>
                ) : canPay ? (
                  <PayPalPaymentButton lines={orderLines(cart)} onApproved={handleApproved} />
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed bg-white/10 py-4 text-[11px] font-medium tracking-[0.28em] text-white/25 uppercase"
                  >
                    {token ? "Paiement indisponible" : "Payer avec PayPal"}
                  </button>
                )}
              </div>
              <p className="mt-3 text-center text-[10px] leading-relaxed tracking-wider text-white/25">
                {token
                  ? "Vérification confirmée. PayPal ou carte, sans quitter la page."
                  : "Le paiement reste bloqué tant que le contrôle n’est pas validé."}
              </p>
              {error ? (
                <p className="mt-4 text-center text-[11px] leading-relaxed text-[#ffb4b4]" role="alert">
                  {error}
                </p>
              ) : null}
              <Link
                href="/"
                className="mt-6 block w-full border border-white/15 py-3 text-center text-[10px] tracking-[0.22em] text-white/70 uppercase hover:border-white hover:text-white"
              >
                Retour à la boutique
              </Link>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
