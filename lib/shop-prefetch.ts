import { cldOpt } from "@/components/molecules/product-card";

const prefetched = new Set<string>();

/** Précharge les visuels modale (recto / verso) au survol carte — perçu instantané. */
export function prefetchShopProductMedia(image: string, imageBack?: string): void {
  if (typeof window === "undefined") return;
  for (const raw of [image, imageBack?.trim()].filter((url): url is string => Boolean(url))) {
    const url = cldOpt(raw, 1200);
    if (prefetched.has(url)) continue;
    prefetched.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}
