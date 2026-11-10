"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { shopBasePathFromPathname, shopHref } from "@/lib/shop-base-path";

/** Redirige vers la vitrine avec la modale Héritage ouverte (vitrine visible derrière). */
export default function DingryHeritagePage() {
  const router = useRouter();
  const shopBasePath = shopBasePathFromPathname(usePathname() ?? "/");

  useEffect(() => {
    router.replace(`${shopHref(shopBasePath, "/")}?heritage=1`, { scroll: false });
  }, [router, shopBasePath]);

  return null;
}
