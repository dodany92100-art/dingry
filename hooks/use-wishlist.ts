"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WISHLIST_KEY, readWishlistIds, toggleWishlistId } from "@/lib/wishlist";

export function useWishlist() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    setIds(readWishlistIds());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== WISHLIST_KEY) return;
      setIds(readWishlistIds());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleFavorite = useCallback((productId: number) => {
    setIds(toggleWishlistId(productId));
  }, []);

  const isFavorite = useCallback((productId: number) => ids.includes(productId), [ids]);

  const favoriteCount = ids.length;

  const idsReadonly = useMemo(() => ids as readonly number[], [ids]);

  return {
    ids: idsReadonly,
    toggleFavorite,
    isFavorite,
    favoriteCount,
    /** @deprecated Préférer `toggleFavorite` */
    toggle: toggleFavorite,
  };
}
