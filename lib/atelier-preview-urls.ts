import { DINGRY_PRODUCT_MEDIA } from "@/lib/dingry-product-media";

/** Visuel verso atelier (tees configurateur). */
export function atelierVersoPreviewUrl(modelId: string): string | null {
  if (modelId === "tee-blanc") return DINGRY_PRODUCT_MEDIA.teeWhiteVerso;
  if (modelId === "tee-noir") return DINGRY_PRODUCT_MEDIA.teeBlackVerso;
  return null;
}
