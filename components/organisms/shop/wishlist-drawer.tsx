"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Share2 } from "lucide-react";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import { DingryCopyToast } from "@/components/molecules/dingry-copy-toast";
import { WishlistGridItem } from "@/components/molecules/wishlist-grid-item";
import type { ShopProduct } from "@/lib/catalog";
import { catalogRectoId } from "@/lib/dingry-product-display";
import { shopHref, type ShopBasePath } from "@/lib/shop-base-path";
import { CATALOG_PRODUCT_GRID_CLASS } from "./catalog-layout";
import { useTranslation } from "@/hooks/use-translation";
import { DRAWER_PANEL_SPRING, MODAL_OVERLAY_TRANSITION } from "./motion";

type WishlistDrawerProps = {
  open: boolean;
  onClose: () => void;
  wishlistIds: readonly number[];
  products: readonly ShopProduct[];
  shopBasePath?: ShopBasePath;
  purchaseDisabled?: boolean;
  onOpenProduct: (product: ShopProduct, side?: ProductFlipSide) => void;
  onToggleWishlist: (rectoId: number) => void;
  onDiscoverCollection: () => void;
  onAddToCart: (product: ShopProduct, size: string, from: HTMLElement) => void;
};

function boutiqueShareUrl(base: ShopBasePath): string {
  if (typeof window === "undefined") return shopHref(base, "/");
  return new URL(shopHref(base, "/"), window.location.origin).toString();
}

export function WishlistDrawer({
  open,
  onClose,
  wishlistIds,
  products,
  shopBasePath = "/",
  purchaseDisabled = false,
  onOpenProduct,
  onToggleWishlist,
  onDiscoverCollection,
  onAddToCart,
}: WishlistDrawerProps) {
  const { t } = useTranslation();
  const [copyToastVisible, setCopyToastVisible] = useState(false);

  const items = useMemo(() => {
    const byRecto = new Map<number, ShopProduct>();
    for (const product of products) {
      byRecto.set(catalogRectoId(product.id), product);
    }
    return wishlistIds
      .map((id) => byRecto.get(id))
      .filter((product): product is ShopProduct => product !== undefined);
  }, [products, wishlistIds]);

  const openProductAndClose = useCallback(
    (product: ShopProduct, side: ProductFlipSide = "recto") => {
      onOpenProduct(product, side);
      onClose();
    },
    [onClose, onOpenProduct],
  );

  const shareSelection = useCallback(async () => {
    const url = boutiqueShareUrl(shopBasePath);
    const payload = { title: t("wishlist.shareTitle"), text: t("wishlist.shareText"), url };
    try {
      if (typeof navigator.share === "function") {
        if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
          throw new Error("share-unsupported");
        }
        await navigator.share(payload);
        return;
      }
      throw new Error("share-unavailable");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setCopyToastVisible(true);
        window.setTimeout(() => setCopyToastVisible(false), 2800);
      } catch {
        // navigation privée
      }
    }
  }, [shopBasePath, t]);

  const handleAddToCart = useCallback(
    (product: ShopProduct, size: string, from: HTMLElement) => {
      onAddToCart(product, size, from);
    },
    [onAddToCart],
  );

  return (
    <>
      <DingryCopyToast visible={copyToastVisible} />
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
              className="dingry-sale-ui relative z-10 flex h-full w-full max-w-xl flex-col border-l border-white/[0.08] bg-[#0a0a0a] shadow-[-24px_0_80px_rgba(0,0,0,0.5)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={DRAWER_PANEL_SPRING}
              aria-labelledby="dingry-wishlist-title"
            >
              <div className="dingry-gold-rule-bottom flex items-start justify-between gap-4 p-6 md:p-8">
                <div>
                  <p className="text-[10px] tracking-[0.28em] text-white/40 uppercase">{t("wishlist.title")}</p>
                  <h2 id="dingry-wishlist-title" className="mt-2 text-sm font-bold tracking-[0.22em] uppercase">
                    {t("wishlist.myFavorites")}
                  </h2>
                  {items.length > 0 ? (
                    <p className="mt-1 text-xs text-white/45">
                      {t(items.length > 1 ? "wishlist.itemsCountOther" : "wishlist.itemsCountOne", {
                        count: items.length,
                      })}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {items.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => void shareSelection()}
                      className="flex h-10 items-center gap-2 px-2 text-[10px] tracking-[0.16em] text-white/45 uppercase transition-colors hover:text-white"
                      aria-label={t("wishlist.shareAria")}
                    >
                      <Share2 size={16} strokeWidth={1.5} aria-hidden />
                      <span className="hidden sm:inline">{t("wishlist.share")}</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t("wishlist.closeAria")}
                    className="flex h-10 w-10 items-center justify-center text-white/40 transition-colors hover:text-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <p className="text-sm tracking-[0.12em] text-white/35 uppercase">{t("wishlist.empty")}</p>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">{t("wishlist.emptyHint2")}</p>
                  <button
                    type="button"
                    onClick={onDiscoverCollection}
                    className="dingry-gold-pill-btn mt-8 h-11 w-full max-w-xs rounded-full px-6 text-[11px] uppercase tracking-[0.18em]"
                  >
                    <span className="gold-text">{t("wishlist.discoverCollection")}</span>
                  </button>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
                  <div className={CATALOG_PRODUCT_GRID_CLASS}>
                    {items.map((product) => {
                      const rectoId = catalogRectoId(product.id);
                      return (
                        <WishlistGridItem
                          key={rectoId}
                          product={product}
                          catalog={products}
                          wishlistActive
                          purchaseDisabled={purchaseDisabled}
                          onOpenProduct={openProductAndClose}
                          onToggleWishlist={onToggleWishlist}
                          onAddToCart={handleAddToCart}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {items.length > 0 ? (
                <div className="dingry-gold-rule-top shrink-0 space-y-3 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <button
                    type="button"
                    onClick={() => void shareSelection()}
                    className="flex w-full items-center justify-center gap-2 border border-white/15 py-3 text-[10px] tracking-[0.2em] text-white/55 uppercase transition-colors hover:border-white/35 hover:text-white"
                  >
                    <Share2 size={14} strokeWidth={1.5} aria-hidden />
                    {t("wishlist.shareSelectionCta")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDiscoverCollection();
                      onClose();
                    }}
                    className="w-full border border-white/20 py-3.5 text-[11px] tracking-[0.22em] text-white/70 uppercase transition-colors hover:border-white/40 hover:text-white"
                  >
                    {t("wishlist.continueShopping")}
                  </button>
                </div>
              ) : null}
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
