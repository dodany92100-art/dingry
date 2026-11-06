"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ShopProduct } from "@/lib/catalog";
import {
  consumeCheckoutConfirmation,
  readStoredCart,
  writeStoredCart,
  type CheckoutConfirmation,
} from "@/lib/checkout-draft";
import {
  addCartLine,
  addPersonalizedCartLine,
  cartItemCount,
  cartSubtotal,
  removeCartLine,
  updateCartLineQuantity,
  updateCartLineSize,
  type CartLine,
} from "@/lib/shop-view";

/** Panier (localStorage via lib/checkout-draft), tiroir et confirmation de retour de paiement. */
export function useShopCart() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<CheckoutConfirmation | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Retour de /checkout (confirmation) ou panier sauvegardé.
  useEffect(() => {
    const returned = consumeCheckoutConfirmation();
    if (returned) {
      writeStoredCart([]);
      setItems([]);
      setConfirmation(returned);
      setToastVisible(true);
      setOpen(true);
      setHydrated(true);
      const timer = window.setTimeout(() => setToastVisible(false), 6500);
      return () => window.clearTimeout(timer);
    }
    const saved = readStoredCart();
    if (saved.length > 0) setItems(saved);
    setHydrated(true);
  }, []);

  // ?panier=1 : rouvre le tiroir si le panier n'est pas vide.
  useEffect(() => {
    if (searchParams.get("panier") !== "1") return;
    if (readStoredCart().length === 0) return;
    setOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredCart(items);
  }, [items, hydrated]);

  const addLine = useCallback((product: ShopProduct, size: string, qty: number) => {
    setItems((prev) => addCartLine(prev, product, size, qty));
    setOpen(true);
  }, []);

  const addPersonalizedLine = useCallback(
    (product: ShopProduct, size: string, qty: number, personalization: string) => {
      setItems((prev) => addPersonalizedCartLine(prev, product, size, qty, personalization));
      setOpen(true);
    },
    [],
  );

  const updateQuantity = useCallback((index: number, delta: number) => {
    setItems((prev) => updateCartLineQuantity(prev, index, delta));
  }, []);

  const removeLine = useCallback((index: number) => {
    setItems((prev) => removeCartLine(prev, index));
  }, []);

  const updateSize = useCallback((index: number, newSize: string) => {
    setItems((prev) => updateCartLineSize(prev, index, newSize));
  }, []);

  /** Écriture explicite avant la navigation vers /checkout. */
  const persist = useCallback(() => writeStoredCart(items), [items]);

  const dismissConfirmation = useCallback(() => {
    setConfirmation(null);
    setOpen(false);
  }, []);

  return {
    items,
    open,
    setOpen,
    count: cartItemCount(items),
    total: cartSubtotal(items),
    confirmation,
    toastVisible,
    addLine,
    addPersonalizedLine,
    updateQuantity,
    updateSize,
    removeLine,
    persist,
    dismissConfirmation,
  };
}
