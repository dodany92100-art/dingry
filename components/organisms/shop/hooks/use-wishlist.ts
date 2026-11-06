"use client";

import { useCallback, useEffect, useState } from "react";
import { readWishlistIds, toggleWishlistId } from "@/lib/wishlist";

export function useWishlist() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    setIds(readWishlistIds());
  }, []);

  const toggle = useCallback((rectoId: number) => {
    setIds(toggleWishlistId(rectoId));
  }, []);

  return { ids, toggle };
}
