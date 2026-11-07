const LOGO_PATH = "v1793299822/WhatsApp_Image_2026-10-28_at_14.07.43-removebg-preview_rrprgr.png";

/** Visuel plein écran accueil teasing + hero boutique (`public/dingry-teasing.jpg`). */
export const DINGRY_TEASING_HERO_SRC = "/dingry-teasing.jpg";

export const DINGRY_LOGO_URL = `https://res.cloudinary.com/dc9xmxpvv/image/upload/${LOGO_PATH}`;

/** Symbole X · fond noir — favicon, Apple touch, WhatsApp (`public/dingry-favicon.jpg`, 400×400). */
export const DINGRY_FAVICON_SRC = "/dingry-favicon.jpg";

export const DINGRY_FAVICON_URL = DINGRY_FAVICON_SRC;
export const DINGRY_APPLE_ICON_URL = DINGRY_FAVICON_SRC;

/** Open Graph / WhatsApp — logo DINGRY (pas le favicon X), fond sombre 1200×630. */
const DINGRY_OG_TRANSFORM = "c_pad,b_rgb:050505,w_1200,h_630,q_auto,f_jpg";
export const DINGRY_OG_IMAGE_URL = `https://res.cloudinary.com/dc9xmxpvv/image/upload/${DINGRY_OG_TRANSFORM}/${LOGO_PATH}`;

export const DINGRY_OPEN_GRAPH_IMAGE = {
  url: DINGRY_OG_IMAGE_URL,
  width: 1200,
  height: 630,
  alt: "DINGRY Paris",
} as const;
