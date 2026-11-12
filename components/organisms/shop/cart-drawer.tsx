"use client";

import { AnimatePresence, motion } from "motion/react";
import { cldOpt } from "@/components/molecules/product-card";
import type { CheckoutConfirmation } from "@/lib/checkout-draft";
import { DINGRY_PRODUCT_MODAL_AMBIENCE_SRC } from "@/lib/dingry-brand";
import { useTranslation } from "@/hooks/use-translation";
import { lineUnitPrice, cartLineKey, modalSizesFor, type CartLine } from "@/lib/shop-view";
import { CartReassurance } from "@/components/cart/cart-reassurance";
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
  onUpdateSize: (index: number, newSize: string) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  checkoutDisabled: boolean;
  onDiscoverCollection: () => void;
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
  onUpdateSize,
  onRemove,
  onCheckout,
  checkoutDisabled,
  onDiscoverCollection,
}: CartDrawerProps) {
  const { t } = useTranslation();

  function itemsCountLabel(count: number): string {
    return t(count > 1 ? "cart.drawer.itemsCountOther" : "cart.drawer.itemsCountOne", { count });
  }

  function discoverCollectionCta(className?: string) {
    return (
      <button
        type="button"
        onClick={onDiscoverCollection}
        className={
          className ??
          "dingry-gold-pill-btn mt-6 h-11 w-full max-w-xs rounded-full px-5 text-xs uppercase tracking-[0.16em] md:text-sm"
        }
      >
        <span className="gold-text">{t("cart.drawer.discoverCollection")}</span>
      </button>
    );
  }
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
              aria-label={t("cart.drawer.closeContinueAria")}
            />
            <img
              src={DINGRY_PRODUCT_MODAL_AMBIENCE_SRC}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent"
              aria-hidden
            />
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
            className="dingry-sale-ui dingry-cart-drawer-panel relative z-10 flex h-full min-h-0 w-full max-w-md flex-col border-l border-white/[0.06] bg-[#0a0a0a] shadow-[-24px_0_80px_rgba(0,0,0,0.45)] will-change-transform"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={DRAWER_PANEL_SPRING}
          >
            <div className="dingry-gold-rule-bottom relative flex items-center justify-between p-8">
              <div>
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase">
                  {confirmation ? t("cart.drawer.confirmedTitle") : t("cart.drawer.title")}
                </h2>
                {count > 0 && !confirmation ? (
                  <p className="mt-1 text-xs text-white/40">
                    {itemsCountLabel(count)} ·{" "}
                    <span className="dingry-cart-recap-amount text-sm tabular-nums text-white/75">
                      {total} €
                    </span>{" "}
                    {t("common.ttc")}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("cart.drawer.closeAria")}
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
                  <div data-cart-confirm className="w-full border border-[#FF3D00]/40 bg-[#FF3D00]/10 p-6">
                    <p className="text-[10px] tracking-[0.35em] text-[#FF3D00] uppercase">{t("cart.drawer.orderValidated")}</p>
                    <p className="mt-4 text-sm leading-relaxed text-white">
                      {t("cart.drawer.thanksPaypal", { name: confirmation.payerName })}
                    </p>
                    <p className="mt-4 text-[10px] tracking-[0.22em] text-white/40 uppercase">
                      {t("cart.drawer.refLabel")} {confirmation.orderId}
                    </p>
                    <ul className="dingry-gold-rule-top relative mt-4 space-y-2 pt-4 text-sm text-white/75">
                      {confirmation.items.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    <p className="dingry-product-price dingry-product-price--lg dingry-product-price--on-dark mt-4">{confirmation.total}€</p>
                    {confirmation.shippingAddress ? (
                      <div className="dingry-gold-rule-top relative mt-4 pt-4 text-xs leading-relaxed text-white/55">
                        <p className="text-[10px] tracking-[0.22em] text-white/35 uppercase mb-1">{t("cart.drawer.delivery")}</p>
                        <p>{confirmation.shippingName}</p>
                        <p>{confirmation.shippingAddress}</p>
                      </div>
                    ) : null}
                    {confirmation.email ? <p className="mt-3 text-xs text-white/40">{confirmation.email}</p> : null}
                    <button
                      type="button"
                      onClick={onDismissConfirmation}
                      className="mt-6 w-full py-4 bg-white text-[#050505] text-xs font-bold tracking-[0.3em] uppercase hover:bg-[#FF3D00] hover:text-white transition-colors"
                    >
                      {t("cart.drawer.continue")}
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center text-center">
                    <p className="mb-2 text-sm uppercase tracking-[0.3em] text-white/20">{t("cart.drawer.empty")}</p>
                    {discoverCollectionCta()}
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-4 text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-white"
                    >
                      {t("cart.drawer.continueShopping")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6">
                {items.map((item, idx) => {
                  const lineKey = cartLineKey(item);
                  const sizeOptions = modalSizesFor(item.product);
                  return (
                  <div
                    key={lineKey}
                    data-cart-line
                    className="flex gap-4 border border-white/[0.08] bg-[#080808] p-5 sm:gap-5"
                  >
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
                        <p className="text-xs text-[#FF3D00] mt-1 tracking-wider uppercase">« {item.personalization} »</p>
                      )}
                      <div className="mt-2">
                        <p className="text-[9px] tracking-[0.25em] text-white/35 uppercase mb-1.5">{t("cart.drawer.size")}</p>
                        <div
                          className="flex flex-wrap gap-1.5"
                          role="group"
                          aria-label={t("cart.drawer.sizeFor", { name: item.product.name })}
                        >
                          {sizeOptions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => onUpdateSize(idx, s)}
                              aria-pressed={item.size === s}
                              className={`min-w-[2.25rem] px-2 py-1 text-[10px] font-medium tracking-widest border transition-colors duration-150 ${
                                item.size === s
                                  ? "border-white bg-white text-[#050505]"
                                  : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[9px] tracking-[0.25em] text-white/35 uppercase">{t("cart.drawer.quantity")}</span>
                        <div className="flex items-center border border-white/15">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(idx, -1)}
                            aria-label={t("cart.drawer.decreaseQty", { name: item.product.name })}
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
                            aria-label={t("cart.drawer.increaseQty", { name: item.product.name })}
                            className="w-7 h-7 text-white/55 hover:bg-white hover:text-black transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="dingry-product-price dingry-product-price--sm dingry-product-price--on-dark mt-2">
                        {lineUnitPrice(item) * item.qty} €
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      aria-label={t("cart.drawer.removeItem", { name: item.product.name })}
                      className="mt-1 self-start text-white/20 transition-colors hover:text-white/60"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  );
                })}
                <CartReassurance tone="dark" className="mt-2 border-white/10" />
              </div>
            )}

            {items.length > 0 && (
              <div className="dingry-gold-rule-top relative z-10 shrink-0 bg-[#0a0a0a] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <p className="text-[10px] tracking-[0.22em] text-white/35 uppercase">{t("cart.drawer.recap")}</p>
                  <p
                    className="dingry-cart-recap-total shrink-0 tabular-nums text-white/80"
                    aria-label={t("cart.drawer.totalAria", { total })}
                  >
                    {total} €
                  </p>
                </div>
                <div className="space-y-2 text-sm text-white/55">
                  <div className="flex justify-between items-baseline gap-4">
                    <span>{t("cart.subtotal")}</span>
                    <span className="dingry-cart-recap-amount shrink-0 tabular-nums text-white/75">{total} €</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4">
                    <span>{t("cart.shippingLabel")}</span>
                    <span className="shrink-0 text-xs tracking-wide text-white/45 uppercase">
                      {t("cart.shippingHint")}
                    </span>
                  </div>
                  <div className="relative z-[1] flex justify-between items-baseline gap-4 border-t border-white/15 pt-3">
                    <span className="text-xs font-medium tracking-[0.22em] uppercase text-white/70">{t("cart.totalTtc")}</span>
                    <span className="dingry-cart-recap-amount dingry-cart-recap-amount--lg shrink-0 tabular-nums text-white/80">
                      {total} €
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCheckout}
                  disabled={checkoutDisabled}
                  className="mt-5 w-full border border-white/20 bg-white py-4 text-[11px] font-medium tracking-[0.28em] text-[#050505] uppercase transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-white/10 disabled:text-white/25"
                >
                  {t("cart.checkoutCta")}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full py-2 text-[10px] tracking-[0.2em] text-white/45 uppercase hover:text-white"
                >
                  {t("cart.continueShoppingAlt")}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
