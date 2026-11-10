"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cldOpt } from "@/components/molecules/product-card";
import type { ShopProduct } from "@/lib/catalog";
import { catalogRectoId, storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { DRAWER_PANEL_SPRING, MODAL_OVERLAY_TRANSITION } from "./motion";

type WishlistDrawerProps = {
  open: boolean;
  onClose: () => void;
  wishlistIds: readonly number[];
  products: readonly ShopProduct[];
  onOpenProduct: (product: ShopProduct) => void;
  onToggleWishlist: (rectoId: number) => void;
  onDiscoverCollection: () => void;
};

export function WishlistDrawer({
  open,
  onClose,
  wishlistIds,
  products,
  onOpenProduct,
  onToggleWishlist,
  onDiscoverCollection,
}: WishlistDrawerProps) {
  const items = useMemo(() => {
    const byRecto = new Map<number, ShopProduct>();
    for (const product of products) {
      byRecto.set(catalogRectoId(product.id), product);
    }
    return wishlistIds
      .map((id) => byRecto.get(id))
      .filter((product): product is ShopProduct => product !== undefined);
  }, [products, wishlistIds]);

  return (
    <AnimatePresence>
      {open ? (
        <div key="dingry-wishlist-drawer" className="fixed inset-0 z-[70] flex justify-end">
          <motion.div
            className="absolute inset-0 bg-[#050505]/85 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_OVERLAY_TRANSITION}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className="dingry-sale-ui relative z-10 flex h-full w-full max-w-lg flex-col border-l border-white/[0.08] bg-[#0a0a0a] shadow-[-24px_0_80px_rgba(0,0,0,0.5)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={DRAWER_PANEL_SPRING}
            aria-labelledby="dingry-wishlist-title"
          >
            <div className="dingry-gold-rule-bottom flex items-start justify-between gap-4 p-6 md:p-8">
              <div>
                <p className="text-[10px] tracking-[0.28em] text-white/40 uppercase">Liste de souhaits</p>
                <h2 id="dingry-wishlist-title" className="mt-2 text-sm font-bold tracking-[0.22em] uppercase">
                  Mes favoris
                </h2>
                {items.length > 0 ? (
                  <p className="mt-1 text-xs text-white/45">
                    {items.length} article{items.length > 1 ? "s" : ""}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la liste de favoris"
                className="flex h-10 w-10 items-center justify-center text-white/40 transition-colors hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <p className="text-sm tracking-[0.12em] text-white/35 uppercase">Aucun favori pour le moment.</p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
                  Touchez le cœur sur un article pour l&apos;enregistrer ici.
                </p>
                <button
                  type="button"
                  onClick={onDiscoverCollection}
                  className="dingry-gold-pill-btn mt-8 h-11 w-full max-w-xs rounded-full px-6 text-[11px] uppercase tracking-[0.18em]"
                >
                  <span className="gold-text">Découvrir la collection</span>
                </button>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-white/[0.08] overflow-y-auto overscroll-contain">
                {items.map((product) => {
                  const rectoId = catalogRectoId(product.id);
                  const title = storefrontProductTitle(product, products);
                  const variant = storefrontProductSubtitle(product, products);
                  return (
                    <li key={rectoId} className="flex gap-4 p-5 sm:gap-5 sm:p-6">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenProduct(product);
                          onClose();
                        }}
                        className="flex min-w-0 flex-1 gap-4 text-left sm:gap-5"
                      >
                        <div className="h-28 w-20 shrink-0 overflow-hidden bg-[#080808]">
                          <img
                            src={cldOpt(product.image, 240)}
                            alt={title}
                            className="h-full w-full object-contain object-center"
                            decoding="async"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/90">{title}</p>
                          {variant ? (
                            <p className="mt-1 text-[10px] tracking-[0.14em] text-white/45 uppercase">{variant}</p>
                          ) : null}
                          <p className="dingry-product-price dingry-product-price--sm dingry-product-price--on-dark mt-3">
                            {product.price} €
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleWishlist(rectoId)}
                        className="self-start text-[10px] tracking-[0.16em] text-white/35 uppercase underline-offset-2 hover:text-white hover:underline"
                      >
                        Retirer
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {items.length > 0 ? (
              <div className="dingry-gold-rule-top shrink-0 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => {
                    onDiscoverCollection();
                    onClose();
                  }}
                  className="w-full border border-white/20 py-3.5 text-[11px] tracking-[0.22em] text-white/70 uppercase transition-colors hover:border-white/40 hover:text-white"
                >
                  Continuer vos achats
                </button>
              </div>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
