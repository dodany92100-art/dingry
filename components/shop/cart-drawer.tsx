"use client";

import { AnimatePresence, motion } from "motion/react";
import { cldOpt } from "@/components/product-card";
import type { CheckoutConfirmation } from "@/lib/checkout-draft";
import { DINGRY_DELIVERY_ESTIMATE, DINGRY_SHIPPING_LABEL } from "@/lib/dingry-checkout-copy";
import { DINGRY_MANIFESTO_FR, DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import { IMAGES } from "@/lib/shop-data";
import { lineUnitPrice, type CartLine } from "@/lib/shop-view";
import { DRAWER_PANEL_SPRING, MODAL_OVERLAY_TRANSITION } from "./motion";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  onExitComplete?: () => void;
  items: CartLine[];
  count: number;
  total: number;
  confirmation: CheckoutConfirmation | null;
  onDismissConfirmation: () => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  checkoutDisabled: boolean;
};

export function CartDrawer({
  open,
  onClose,
  onExitComplete,
  items,
  count,
  total,
  confirmation,
  onDismissConfirmation,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  checkoutDisabled,
}: CartDrawerProps) {
  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <div key="dingry-cart-drawer" className="fixed inset-0 z-[70] flex justify-end md:justify-stretch">
          <motion.aside
            className="relative hidden min-w-0 flex-1 overflow-hidden md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_OVERLAY_TRANSITION}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute inset-0 z-20 cursor-pointer"
              aria-label="Fermer le panier et continuer vos achats"
            />
            <img src={IMAGES.editorial} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/75 to-[#050505]/40" />
            <div className="pointer-events-none relative z-10 flex h-full max-w-lg flex-col justify-end p-10 lg:p-14">
              <p className="dingry-typo-eyebrow text-[#0066FF]">DINGRY Paris</p>
              <p className="dingry-typo-manifesto mt-4 text-white/75">{DINGRY_MANIFESTO_FR}</p>
              <p className="dingry-typo-street dingry-typo-street--lg mt-3">{DINGRY_STREET_LINE}</p>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">{DINGRY_DELIVERY_ESTIMATE}</p>
              <p className="mt-10 text-[10px] tracking-[0.24em] text-white/35 uppercase">
                Cliquez pour continuer vos achats
              </p>
            </div>
          </motion.aside>
          <motion.div
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_OVERLAY_TRANSITION}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className="dingry-cart-drawer-panel relative z-10 flex h-full min-h-0 w-full max-w-md flex-col border-l border-white/[0.06] bg-[#0a0a0a] shadow-[-24px_0_80px_rgba(0,0,0,0.45)] will-change-transform"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={DRAWER_PANEL_SPRING}
          >
            <div className="flex items-center justify-between p-8 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase">
                  {confirmation ? "Commande confirmée" : "Panier"}
                </h2>
                {count > 0 && !confirmation ? (
                  <p className="mt-1 text-xs text-white/40">
                    {count} article{count > 1 ? "s" : ""} · {DINGRY_SHIPPING_LABEL.toLowerCase()}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-8 overflow-y-auto">
                {confirmation ? (
                  <div className="w-full border border-[#0066FF]/40 bg-[#0066FF]/10 p-6">
                    <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase">Commande validée</p>
                    <p className="mt-4 text-sm leading-relaxed text-white">
                      Merci {confirmation.payerName}. Un reçu e-mail vous a été envoyé par PayPal.
                    </p>
                    <p className="mt-4 text-[10px] tracking-[0.22em] text-white/40 uppercase">
                      Réf. {confirmation.orderId}
                    </p>
                    <ul className="mt-4 space-y-2 border-t border-white/[0.08] pt-4 text-sm text-white/75">
                      {confirmation.items.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    <p className="mt-4 text-base font-bold">{confirmation.total}€</p>
                    {confirmation.shippingAddress ? (
                      <div className="mt-4 border-t border-white/[0.08] pt-4 text-xs leading-relaxed text-white/55">
                        <p className="text-[10px] tracking-[0.22em] text-white/35 uppercase mb-1">Livraison</p>
                        <p>{confirmation.shippingName}</p>
                        <p>{confirmation.shippingAddress}</p>
                      </div>
                    ) : null}
                    {confirmation.email ? <p className="mt-3 text-xs text-white/40">{confirmation.email}</p> : null}
                    <button
                      type="button"
                      onClick={onDismissConfirmation}
                      className="mt-6 w-full py-4 bg-white text-[#050505] text-xs font-bold tracking-[0.3em] uppercase hover:bg-[#0066FF] hover:text-white transition-colors"
                    >
                      Continuer
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm tracking-[0.3em] text-white/20 uppercase mb-2">Votre panier est vide.</p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-6 text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-white"
                    >
                      Continuer vos achats
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-6">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 border border-white/[0.05] p-4 bg-[#080808]">
                    <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden bg-[#0a0a0a]">
                      <img
                        src={cldOpt(item.product.image, 240)}
                        alt={item.product.name}
                        className="max-h-full max-w-full object-contain object-center"
                        decoding="async"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">{item.product.name}</p>
                      <p className="text-sm font-medium tracking-widest uppercase truncate">{item.product.variant}</p>
                      {item.personalization && (
                        <p className="text-xs text-[#0066FF] mt-1 tracking-wider uppercase">« {item.personalization} »</p>
                      )}
                      <p className="mt-1 text-xs text-white/40">Taille {item.size}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[9px] tracking-[0.25em] text-white/35 uppercase">Quantité</span>
                        <div className="flex items-center border border-white/15">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(idx, -1)}
                            aria-label={`Diminuer la quantité de ${item.product.name}`}
                            className="w-7 h-7 text-white/55 hover:bg-white hover:text-black transition-colors"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-xs" aria-live="polite">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(idx, 1)}
                            aria-label={`Augmenter la quantité de ${item.product.name}`}
                            className="w-7 h-7 text-white/55 hover:bg-white hover:text-black transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-bold">{lineUnitPrice(item) * item.qty} €</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      aria-label={`Retirer ${item.product.name} du panier`}
                      className="mt-1 self-start text-white/20 transition-colors hover:text-white/60"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="sticky bottom-0 shrink-0 border-t border-white/[0.06] bg-[#0a0a0a] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <p className="mb-4 text-[10px] tracking-[0.22em] text-white/35 uppercase">Récapitulatif</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/55">
                    <span>Sous-total</span>
                    <span>{total} €</span>
                  </div>
                  <div className="flex justify-between text-white/55">
                    <span>{DINGRY_SHIPPING_LABEL}</span>
                    <span>0 €</span>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.06] pt-3 text-base font-bold">
                    <span className="text-xs tracking-[0.22em] uppercase text-white/40">Total TTC</span>
                    <span>{total} €</span>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-relaxed tracking-wide text-white/35">{DINGRY_DELIVERY_ESTIMATE}</p>
                <button
                  type="button"
                  onClick={onCheckout}
                  disabled={checkoutDisabled}
                  className="mt-5 w-full bg-white py-4 text-[11px] font-medium tracking-[0.28em] text-[#050505] uppercase transition-colors hover:bg-[#0066FF] hover:text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
                >
                  Passer au paiement
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full py-2 text-[10px] tracking-[0.2em] text-white/45 uppercase hover:text-white"
                >
                  Continuer mes achats
                </button>
                <p className="mt-3 text-center text-[10px] leading-relaxed tracking-wide text-white/25">
                  Paiement sécurisé sur la page suivante (PayPal ou carte).
                </p>
              </div>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
