/**
 * Abréviations couleur DINGRY (3–4 lettres, majuscules, sans chiffres) · SKU / R2.
 */

import { abbrevSourceFromColorDeclination } from "@/lib/catalog/dingry-color-custom";
import { normalizeOptionKey } from "@/lib/catalog/product-options";

/** Clés = `colorDeclinations` / presets admin (`NOIR`, `ROYAL BLUE`, …). */
const OFFICIAL_COLOR_ABBREV: Record<string, string> = {
  NOIR: "BLK",
  BLACK: "BLK",
  BLANC: "WHT",
  WHITE: "WHT",
  GRIS: "GRY",
  "GRIS CHINÉ": "HGY",
  "GRIS CHINE": "HGY",
  "KING BLUE": "ROY",
  "ROYAL BLUE": "ROY",
  "BLEU ROI": "ROY",
  ROUGE: "RED",
  ORANGE: "ORG",
  VERT: "GRN",
  "JAUNE FLUO": "YLW",
  PURPLE: "VIO",
  CHOCOLAT: "BRN",
  ZENITH: "ZTH",
  PINK: "PNK",
};

const ABBREV_PATTERN = /^[A-Z]{3,4}$/;

function fallbackAbbrevFromLabel(raw: string): string {
  const letters = normalizeOptionKey(raw).replace(/[^A-Z]/g, "");
  const trimmed = letters.slice(0, 4);
  return trimmed.length >= 3 ? trimmed : "STD";
}

/** Abréviation officielle si preset connu ; sinon 3–4 premières lettres du libellé normalisé. */
export function colorAbbrevFromDeclinationLabel(raw: string): string {
  const source = abbrevSourceFromColorDeclination(raw);
  const key = normalizeOptionKey(source);
  const hit = OFFICIAL_COLOR_ABBREV[key] ?? OFFICIAL_COLOR_ABBREV[source.trim().toUpperCase()];
  if (hit && ABBREV_PATTERN.test(hit)) return hit;
  const fb = fallbackAbbrevFromLabel(raw);
  return ABBREV_PATTERN.test(fb) ? fb : "STD";
}

export function isOfficialColorAbbrev(code: string): boolean {
  return ABBREV_PATTERN.test(code.trim().toUpperCase());
}
