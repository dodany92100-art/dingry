const MARKER = "/upload/";

/** Cloudinary : f_auto, qualité auto, largeur + DPR ; autres URLs inchangées. */
export function cldOpt(url: string, width: number): string {
  const index = url.indexOf(MARKER);
  if (!url.includes("res.cloudinary.com") || index < 0) return url;
  const rest = url.slice(index + MARKER.length);
  if (/^[a-z]{1,3}_[^/]*\//.test(rest)) return url;
  return `${url.slice(0, index + MARKER.length)}f_auto,q_auto:good,w_${width},dpr_auto,c_limit/${rest}`;
}

/** Grille catalogue mobile (~2 colonnes). */
export const CATALOG_CARD_IMAGE_WIDTH = 480;

/** Miniatures panier / complete look. */
export const CATALOG_THUMB_IMAGE_WIDTH = 240;
