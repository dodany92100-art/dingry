const MARKER = "/upload/";

export type CloudinaryPictureSet = {
  avif: string;
  webp: string;
  /** Fallback navigateurs anciens (JPEG livré par Cloudinary). */
  fallback: string;
};

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com") && url.includes(MARKER);
}

/** Enlève un éventuel segment de transformation déjà présent après `/upload/`. */
function cloudinaryPublicPath(url: string): { prefix: string; publicPath: string } | null {
  const index = url.indexOf(MARKER);
  if (!isCloudinaryUrl(url) || index < 0) return null;
  const prefix = url.slice(0, index + MARKER.length);
  let rest = url.slice(index + MARKER.length);
  if (/^[a-z0-9_,:%.-]+\//i.test(rest) && !/^v\d+\//i.test(rest)) {
    rest = rest.slice(rest.indexOf("/") + 1);
  }
  return { prefix, publicPath: rest };
}

function cldTransform(prefix: string, publicPath: string, width: number, format: string): string {
  return `${prefix}f_${format},q_auto:good,w_${width},dpr_auto,c_limit/${publicPath}`;
}

/** Cloudinary : f_auto, qualité auto, largeur + DPR ; autres URLs inchangées. */
export function cldOpt(url: string, width: number): string {
  const parsed = cloudinaryPublicPath(url);
  if (!parsed) return url;
  return cldTransform(parsed.prefix, parsed.publicPath, width, "auto");
}

/** Jeu `<picture>` AVIF → WebP → JPG pour les URLs Cloudinary. */
export function buildCloudinaryPictureSet(url: string, width: number): CloudinaryPictureSet | null {
  const parsed = cloudinaryPublicPath(url);
  if (!parsed) return null;
  return {
    avif: cldTransform(parsed.prefix, parsed.publicPath, width, "avif"),
    webp: cldTransform(parsed.prefix, parsed.publicPath, width, "webp"),
    fallback: cldTransform(parsed.prefix, parsed.publicPath, width, "jpg"),
  };
}

/** Grille catalogue mobile (~2 colonnes). */
export const CATALOG_CARD_IMAGE_WIDTH = 480;

/** Miniatures panier / complete look. */
export const CATALOG_THUMB_IMAGE_WIDTH = 240;
