import { browserSafeImageUrl } from "@/lib/media/browser-safe-image-url";
import { canonicalizeR2PublicImageUrl } from "@/lib/r2/config";

/** URL livrée au navigateur (R2 / local / CRM) — pas de CDN tiers. */
export function deliveryImageUrl(url: string, _width?: number): string {
  void _width;
  return browserSafeImageUrl(canonicalizeR2PublicImageUrl(url.trim()));
}
