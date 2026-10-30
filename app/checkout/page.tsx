"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DingryLogo } from "@/components/dingry-logo";
import { PayPalPaymentButton } from "@/components/paypal-payment-button";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import {
  cartUnitPrice,
  readStoredCart,
  saveCheckoutConfirmation,
  writeStoredCart,
  type CheckoutConfirmation,
  type StoredCartItem,
} from "@/lib/checkout-draft";

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
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  useEffect(() => {
    setCart(readStoredCart());
    setReady(true);
  }, []);

  const total = cart.reduce((sum, item) => sum + cartUnitPrice(item) * item.qty, 0);
  const canPay = Boolean(token) && !saving && !confirmation;

  async function registerOrder(orderId: string, turnstileToken: string) {
    setSaving(true);
    setError(null);

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

      if (!response.ok || !payload?.order) {
        setToken(null);
        setWidgetKey((key) => key + 1);
        setPendingOrderId(orderId);
        setError(payload?.error ?? "La commande n’a pas pu être enregistrée. Relancez la vérification.");
        return;
      }

      writeStoredCart([]);
      saveCheckoutConfirmation(payload.order);
      setCart([]);
      setConfirmation(payload.order);
      setPendingOrderId(null);
    } catch {
      setPendingOrderId(orderId);
      setError("Réseau indisponible. Le paiement PayPal est reçu : confirmez à nouveau pour enregistrer la commande.");
    } finally {
      setSaving(false);
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
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-8 md:px-5 md:py-14">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" aria-label="Retour à la boutique DINGRY">
            <DingryLogo animate={false} className="h-8 brightness-0 invert md:h-10" />
          </Link>
          <p className="text-[10px] tracking-[0.32em] text-white/35 uppercase">Paiement</p>
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
          <form
            className="border border-white/10 bg-[#0a0a0a] p-4 md:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (pendingOrderId && token) void registerOrder(pendingOrderId, token);
            }}
          >
            <h1 className="text-[10px] tracking-[0.32em] text-white/40 uppercase">Votre commande</h1>
            <ul className="mt-6 divide-y divide-white/[0.06]">
              {cart.map((item, index) => (
                <li key={`${item.product.id}-${item.size}-${index}`} className="flex gap-4 py-4">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-20 w-16 bg-black object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] tracking-[0.22em] text-white/40 uppercase">{item.product.name}</p>
                    <p className="mt-1 text-sm tracking-wide uppercase">{item.product.variant}</p>
                    {item.personalization ? (
                      <p className="mt-1 text-xs tracking-wider text-[#0066FF] uppercase">« {item.personalization} »</p>
                    ) : null}
                    <p className="mt-1 text-xs text-white/40">Taille {item.size} · {item.qty}</p>
                  </div>
                  <p className="text-sm font-medium">{cartUnitPrice(item) * item.qty}€</p>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex items-baseline justify-between border-t border-white/[0.06] pt-5">
              <span className="text-[10px] tracking-[0.28em] text-white/40 uppercase">Total</span>
              <span className="text-xl font-medium">{total}€</span>
            </div>

            <TurnstileWidget key={widgetKey} className="mt-8" onToken={setToken} />

            <div className="mt-6">
              {pendingOrderId ? (
                <button
                  type="submit"
                  disabled={!canPay}
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
                  Payer avec PayPal
                </button>
              )}
            </div>

            <p className="mt-3 text-center text-[10px] leading-relaxed tracking-wider text-white/25">
              {token ? "Vérification confirmée. PayPal ou carte via PayPal." : "Le paiement reste bloqué tant que le contrôle n’est pas validé."}
            </p>
            {error ? (
              <p className="mt-4 text-center text-[11px] leading-relaxed text-[#ffb4b4]" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </main>
  );
}
