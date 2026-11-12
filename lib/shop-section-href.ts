import { shopHref, type ShopBasePath } from "@/lib/shop-base-path";

/** Lien vers une section de la vitrine (`/#catalogue`, etc.). */
export function shopSectionHref(base: ShopBasePath, sectionId: string): string {
  const home = shopHref(base, "/");
  return sectionId ? `${home}#${sectionId}` : home;
}
