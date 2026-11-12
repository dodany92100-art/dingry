"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { CartReassurance } from "@/components/cart/cart-reassurance";
import {
  clearPendingCheckoutOrder,
  readPendingCheckoutOrder,
  readStoredCart,
  saveCheckoutConfirmation,
  savePendingCheckoutOrder,
  writeStoredCart,
  type CheckoutConfirmation,
  type StoredCartItem,
} from "@/lib/checkout-draft";
import {
  DINGRY_DELIVERY_ESTIMATE,
  DINGRY_SHIPPING_AMOUNT_HINT,
  DINGRY_SHIPPING_LABEL,
} from "@/lib/dingry-checkout-copy";
import { DINGRY_MANIFESTO_FR, DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import { clientRateLimitMessage } from "@/lib/client/rate-limit-ui";
import { formatClientCheckoutError } from "@/lib/checkout-diagnostic";
import { PAYPAL_ORDER_FINALIZING_MESSAGE } from "@/lib/paypal-messages";

const PayPalPaymentButton = dynamic(
  () =>
    import("@/components/molecules/paypal-payment-button").then((m) => ({
      default: m.PayPalPaymentButton,
    })),
  { ssr: false },
);

const TurnstileWidget = dynamic(
  () =>
    import("@/components/atoms/turnstile-widget").then((m) => ({ default: m.TurnstileWidget })),
  { ssr: false },
);

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
    ...(item.selectedOption ? { selectedOption: item.selectedOption } : {}),
  }));
}

function shouldPersistPendingCapture(status: number): boolean {
  return status !== 400 && status !== 409;
}

function captureFailureMessage(status: number, serverError: string | undefined, orderId: string): string {
  if (status === 400) {
    const base = serverError ?? "Commande invalide.";
    return `${base} Aucun débit n'a été effectué.`;
  }
  if (status === 503 && serverError === PAYPAL_ORDER_FINALIZING_MESSAGE) {
    return serverError;
  }
  if (status === 503) {
    return `Enregistrement temporairement indisponible. Si PayPal vous a débité, la commande sera finalisée ici ou via notre notification PayPal — vous n'avez rien à refaire. Sinon contactez-nous avec la référence ${orderId}.`;
  }
  if (status === 409) {
    return serverError ?? "Cette commande est déjà enregistrée.";
  }
  if (status === 429) {
    return (
      serverError ??
      "Trop de tentatives. Attendez une minute puis réessayez « Confirmer la commande »."
    );
  }
  return serverError ?? "La commande n'a pas pu être enregistrée.";
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<StoredCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<CheckoutConfirmation | null>(null);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [quoteState, setQuoteState] = useState<"loading" | "ready" | "error">("loading");
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;
  const retryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setCart(readStoredCart());
    const storedPending = readPendingCheckoutOrder();
    if (storedPending) {
      setPendingOrderId(storedPending);
      setError(
        "Paiement en attente de confirmation. Finalisez l’enregistrement ci-dessous (sans repayer).",
      );
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (previous) root.setAttribute("data-theme", previous);
      else root.removeAttribute("data-theme");
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

  const quoteReady = quoteState === "ready" && quote !== null;
  const showPayPalButton =
    quoteReady && !confirmation && !pendingOrderId && !saving;
  const disabledPayLabel =
    quoteState === "error"
      ? "Panier à mettre à jour"
      : quoteState === "loading"
        ? "Calcul du total…"
        : saving
          ? "Enregistrement…"
          : "Paiement indisponible";

  function syncPendingOrder(orderId: string, status: number) {
    if (shouldPersistPendingCapture(status)) {
      savePendingCheckoutOrder(orderId);
      setPendingOrderId(orderId);
    } else {
      clearPendingCheckoutOrder();
      setPendingOrderId(null);
    }
  }

  async function registerOrder(orderId: string, attempt = 0) {
    setSaving(true);
    if (attempt === 0) setError(null);
    let scheduledRetry = false;

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "capture",
          orderId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; order?: CheckoutConfirmation } | null;
      const retryAfterHeader = Number(response.headers.get("Retry-After") ?? "0");
      const finalizing =
        response.status === 503 && payload?.error === PAYPAL_ORDER_FINALIZING_MESSAGE;

      if (response.ok && payload?.order) {
        writeStoredCart([]);
        saveCheckoutConfirmation(payload.order);
        clearPendingCheckoutOrder();
        setCart([]);
        setConfirmation(payload.order);
        setPendingOrderId(null);
        setError(null);
        return;
      }

      if (finalizing && attempt < 12) {
        scheduledRetry = true;
        savePendingCheckoutOrder(orderId);
        setPendingOrderId(orderId);
        setError("Paiement reçu. Finalisation de votre commande…");
        const waitMs = Math.max(1, retryAfterHeader || 3) * 1000;
        if (retryTimerRef.current !== null) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = null;
          void registerOrder(orderId, attempt + 1);
        }, waitMs);
        return;
      }

      if (finalizing) {
        syncPendingOrder(orderId, 503);
        setError(
          "Paiement reçu. Votre confirmation arrivera par e-mail dès que la commande sera enregistrée. Vous pouvez fermer cette page.",
        );
        return;
      }

      syncPendingOrder(orderId, response.status);
      setError(captureFailureMessage(response.status, payload?.error, orderId));
    } catch {
      savePendingCheckoutOrder(orderId);
      setPendingOrderId(orderId);
      setError(
        `Réseau indisponible. Si PayPal vous a débité, réessayez « Confirmer la commande » ou contactez-nous avec la référence ${orderId}.`,
      );
    } finally {
      if (!scheduledRetry) setSaving(false);
    }
  }

  /** Jeton Turnstile à usage unique : nouveau widget après échec de création PayPal. */
  function refreshTurnstileAfterCreate() {
    setToken(null);
    setTurnstileKey((key) => key + 1);
  }

  function backToShop() {
    router.push("/");
  }

  return (
    <main className="dingry-checkout-page dingry-sale-ui min-h-screen bg-[#f6f6f4] text-[#4b5563]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 md:px-6 md:py-14">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/" aria-label="Retour à la boutique DINGRY">
              <DingryLogo animate={false} tone="on-light" className="h-8 md:h-10" />
            </Link>
            <p className="dingry-typo-manifesto mt-3 text-[10px]">{DINGRY_MANIFESTO_FR}</p>
            <p className="dingry-typo-street dingry-typo-street--sm mt-2">{DINGRY_STREET_LINE}</p>
          </div>
          <Link href="/" className="dingry-interactive-luxe text-[10px] tracking-[0.22em] text-[#6b7280] uppercase hover:text-[#4b5563]">
            Retour à la boutique
          </Link>
        </header>

        {!ready ? (
          <p className="text-[11px] tracking-[0.22em] text-[#9ca3af] uppercase">Chargement…</p>
        ) : confirmation ? (
          <section className="dingry-checkout-pay-surface border p-4 md:p-8">
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
            <p className="dingry-product-price dingry-product-price--on-light mt-6">{euros(Math.round(confirmation.total * 100))}</p>
            {confirmation.shippingAddress ? (
              <div className="mt-4 text-sm leading-relaxed text-[#9ca3af]">
                <p>{confirmation.shippingName}</p>
                <p>{confirmation.shippingAddress}</p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={backToShop}
              className="dingry-checkout-pay-primary mt-8"
            >
              Retour à la boutique
            </button>
          </section>
        ) : cart.length === 0 ? (
          <section className="dingry-checkout-pay-surface border p-4 md:p-8">
            <h1 className="dingry-checkout-pay-title">Votre panier est vide.</h1>
            <p className="dingry-checkout-pay-lead mt-3">
              Ajoutez une pièce avant de passer au paiement.
            </p>
            <Link
              href="/"
              className="dingry-checkout-pay-primary mt-8 block text-center"
            >
              Continuer vos achats
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] md:gap-5">
            <section className="dingry-checkout-pay-surface border p-4 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <h1 className="dingry-checkout-pay-eyebrow">Votre commande</h1>
                <Link
                  href="/?panier=1"
                  className="dingry-checkout-pay-link text-[#6b7280] hover:text-[#4b5563]"
                >
                  Modifier le panier
                </Link>
              </div>
              <ul className="mt-6 divide-y divide-[#e5e7eb]">
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
                          className="h-20 w-16 bg-[#f3f4f6] object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm tracking-wide text-[#4b5563] uppercase">{item?.product.name ?? line.label}</p>
                        {item?.product.variant ? (
                          <p className="mt-1 text-xs tracking-wider text-[#9ca3af] uppercase">{item.product.variant}</p>
                        ) : null}
                        {item?.personalization ? (
                          <p className="mt-1 text-xs tracking-wider text-[#6b7280] uppercase">« {item.personalization} »</p>
                        ) : null}
                        <p className="mt-1 text-xs text-[#9ca3af]">Taille {line.size} · {line.qty}</p>
                      </div>
                      <p className="dingry-product-price dingry-product-price--sm dingry-product-price--on-light shrink-0">
                        {quoteState === "ready" ? euros(line.amountCents) : "…"}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 space-y-2 border-t border-[#e5e7eb] pt-5 text-sm text-[#6b7280]">
                <div className="flex justify-between items-baseline gap-4">
                  <span>{DINGRY_SHIPPING_LABEL}</span>
                  <span className="text-xs tracking-wide text-[#9ca3af] uppercase">{DINGRY_SHIPPING_AMOUNT_HINT}</span>
                </div>
                <p className="text-[10px] leading-relaxed tracking-wide text-[#9ca3af]">{DINGRY_DELIVERY_ESTIMATE}</p>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-[#e5e7eb] pt-5">
                <span className="text-[10px] tracking-[0.28em] text-[#9ca3af] uppercase">Total TTC</span>
                <span className="dingry-product-price dingry-product-price--lg dingry-product-price--on-light">
                  {quoteState === "ready" && quote ? euros(quote.totalCents) : quoteState === "error" ? "—" : "Calcul…"}
                </span>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed tracking-wide text-[#9ca3af]">
                Montant validé par DINGRY. Adresse de livraison saisie dans PayPal.
              </p>
            </section>

            <section className="dingry-checkout-pay-surface border p-4 md:sticky md:top-6 md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:p-8">
              <p className="dingry-checkout-pay-eyebrow">Sécurisé</p>
              <p className="dingry-checkout-pay-lead mt-3">
                Après validation du contrôle, vous serez redirigé vers PayPal puis renvoyé ici pour confirmer la commande.
              </p>
              <TurnstileWidget
                key={turnstileKey}
                className="mt-6"
                tone="light"
                onToken={(value) => {
                  setToken(value);
                  if (value) setError(null);
                }}
              />
              <div className="mt-6">
                {quoteState === "loading" ? (
                  <p className="flex items-center justify-center gap-3 py-4 text-[11px] tracking-[0.18em] text-[#9ca3af] uppercase">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d1d5db] border-t-[#6b7280]" aria-hidden />
                    Calcul du total…
                  </p>
                ) : pendingOrderId ? (
                  <>
                    <p className="mb-4 text-center text-xs leading-relaxed text-[#6b7280]">
                      Réf. PayPal {pendingOrderId}. Finalisez l’enregistrement de la commande (sans repayer).
                    </p>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        if (pendingOrderId) void registerOrder(pendingOrderId);
                      }}
                      className="dingry-checkout-pay-primary"
                    >
                      {saving ? "Enregistrement…" : "Confirmer la commande"}
                    </button>
                  </>
                ) : showPayPalButton ? (
                  <PayPalPaymentButton
                    lines={orderLines(cart)}
                    tone="light"
                    getTurnstileToken={() => tokenRef.current}
                    onAfterCreateFailure={refreshTurnstileAfterCreate}
                  />
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed bg-[#e5e7eb] py-4 text-[11px] font-medium tracking-[0.28em] text-[#9ca3af] uppercase"
                  >
                    {disabledPayLabel}
                  </button>
                )}
              </div>
              <p className="dingry-checkout-pay-footnote mt-3 text-center">
                {quoteState === "error"
                  ? "Le total n’a pas pu être validé : modifiez ou videz le panier, puis réessayez."
                  : token
                    ? "Vérification confirmée. Paiement PayPal sur leur site sécurisé."
                    : "Le paiement reste bloqué tant que le contrôle n’est pas validé."}
              </p>
              {error ? (
                <p className="mt-4 text-center text-[11px] leading-relaxed text-[#b91c1c]" role="alert">
                  {error}
                </p>
              ) : null}
              <Link
                href="/"
                className="dingry-checkout-pay-secondary mt-6 block w-full border py-3 text-center text-[10px] tracking-[0.22em] uppercase"
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
