const LOGO_PATH = "v1793299822/WhatsApp_Image_2026-10-28_at_14.07.43-removebg-preview_rrprgr.png";

/** Visuel plein écran accueil teasing + hero boutique (`public/dingry-teasing.jpg`). */
export const DINGRY_TEASING_HERO_SRC = "/dingry-teasing.jpg";

export const DINGRY_LOGO_URL = `https://res.cloudinary.com/dc9xmxpvv/image/upload/${LOGO_PATH}`;

/** Wordmark ROCK THE STREET (Heritage) — à brancher ailleurs plus tard. */
export const DINGRY_STREET_WORDMARK_URL =
  "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1794068055/PHOTO-2026-11-07-16-33-18_xgdfzc.jpg";

/** Symbole X · fond noir — favicon, Apple touch, WhatsApp (`public/dingry-favicon.jpg`, 400×400). */
export const DINGRY_FAVICON_SRC = "/dingry-favicon.jpg";

export const DINGRY_FAVICON_URL = DINGRY_FAVICON_SRC;
export const DINGRY_APPLE_ICON_URL = DINGRY_FAVICON_SRC;

/** Open Graph / WhatsApp — visuel partage (1200×630). */
const DINGRY_OG_PUBLIC_ID = "v1794067901/5e07c5b5-1d5c-4e2f-b82d-3d3e6e64c223_riosv9.jpg";
const DINGRY_OG_TRANSFORM = "c_fill,g_auto,w_1200,h_630,q_auto,f_jpg";
export const DINGRY_OG_IMAGE_URL = `https://res.cloudinary.com/dc9xmxpvv/image/upload/${DINGRY_OG_TRANSFORM}/${DINGRY_OG_PUBLIC_ID}`;

export const DINGRY_OPEN_GRAPH_IMAGE = {
  url: DINGRY_OG_IMAGE_URL,
  width: 1200,
  height: 630,
  alt: "DINGRY Paris",
} as const;
