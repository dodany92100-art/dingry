/** Couleurs perso créées via roue admin : `Corail · #EA580C`. */

const HEX_ONLY = /^#[0-9A-F]{6}$/i;
const NAMED_HEX = /^(.+?)\s·\s(#(?:[0-9A-F]{6}))$/i;

export function normalizeHexColor(raw: string): string | null {
  const trimmed = raw.trim();
  if (!HEX_ONLY.test(trimmed)) return null;
  return trimmed.toUpperCase();
}

export function parseCustomColorDeclination(
  raw: string,
): { name: string; hex: string } | null {
  const trimmed = raw.trim();
  const match = trimmed.match(NAMED_HEX);
  if (!match?.[1] || !match[2]) return null;
  const hex = normalizeHexColor(match[2]);
  if (!hex) return null;
  const name = match[1].trim();
  if (!name) return null;
  return { name, hex };
}

export function buildCustomColorDeclination(name: string, hex: string): string | null {
  const label = name.trim();
  const normalizedHex = normalizeHexColor(hex);
  if (!label || !normalizedHex) return null;
  return `${label} · ${normalizedHex}`;
}

export function hexFromColorDeclination(raw: string): string | null {
  const trimmed = raw.trim();
  const named = parseCustomColorDeclination(trimmed);
  if (named) return named.hex;
  return normalizeHexColor(trimmed);
}

/** Libellé boutique / CRM (sans forcer majuscules). */
export function displayLabelFromColorDeclination(raw: string): string {
  const named = parseCustomColorDeclination(raw);
  if (named) return named.name;
  const hex = normalizeHexColor(raw.trim());
  if (hex) return `Perso · ${hex}`;
  return raw.trim();
}

/** Source abréviation SKU : nom perso ou libellé preset. */
export function abbrevSourceFromColorDeclination(raw: string): string {
  const named = parseCustomColorDeclination(raw);
  if (named) return named.name;
  return raw.trim();
}

export function canonicalCustomColorDeclination(raw: string): string {
  const trimmed = raw.trim();
  const named = parseCustomColorDeclination(trimmed);
  if (named) return buildCustomColorDeclination(named.name, named.hex)!;
  const hex = normalizeHexColor(trimmed);
  if (hex) return hex;
  return trimmed;
}