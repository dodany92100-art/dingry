/**
 * Stop-tags Smart Collage — clôture matière / argumentaire (casse, espaces, # @ optionnels).
 */

const STORY_STOP_PATTERN =
  /(?:#\s*fin(?:de)?\s*(?:d[e']?\s*)?argumentaire\s*@?|#\s*findargumentaire\s*@?|\bfin\s+de\s+argu\b|#\s*fin\s+de\s+argu\s*@?|\bfin\s+argu\s*@|\bfin\s+d['']?\s*argu\s*@)/iu;

/** `@` avant `mat:` / `matière:` (fiche fournisseur, casse libre). */
const STORY_LOOSE_AT_BEFORE_MAT = /\s@\s+(?=(?:mat|mati[eè]re)\s*[:：])/iu;

/** `#` collé avant `prix:` (ex. `…STREET.# prix: 89e`). */
const STORY_LOOSE_HASH_BEFORE_PRIX = /(?:\.|(?<=[\S]))\s*#\s*(?=prix\s*[:：])/iu;

const STORY_STOP_PATTERNS: readonly RegExp[] = [
  STORY_STOP_PATTERN,
  STORY_LOOSE_AT_BEFORE_MAT,
  STORY_LOOSE_HASH_BEFORE_PRIX,
];

const MATERIAL_STOP_PATTERN =
  /(?:\bfin\s+de\s+mati[eè]r(?:e)?\s*#|#\s*fin\s+de\s+mati[eè]r(?:e)?\s*@?|\bfin\s+de\s+mati[eè]r(?:e)?\s*@|\bfin\s+mati[eè]re(?:\s*@)?|\bfin\s+de\s+mati[eè]re\b)/iu;

export function splitAtStoryStop(raw: string): { body: string; tail: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { body: "", tail: "" };
  let cutAt = -1;
  let cutLen = 0;
  for (const re of STORY_STOP_PATTERNS) {
    const m = trimmed.match(re);
    if (m?.index === undefined) continue;
    if (cutAt < 0 || m.index < cutAt) {
      cutAt = m.index;
      cutLen = m[0].length;
    }
  }
  if (cutAt < 0) return { body: trimmed, tail: "" };
  const body = trimmed.slice(0, cutAt).trim();
  const tail = trimmed.slice(cutAt + cutLen).trim();
  return { body, tail };
}

export function splitAtMaterialStop(raw: string): { body: string; tail: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { body: "", tail: "" };
  const m = trimmed.match(MATERIAL_STOP_PATTERN);
  if (!m || m.index === undefined) return { body: trimmed, tail: "" };
  const body = trimmed.slice(0, m.index).trim();
  const tail = trimmed.slice(m.index + m[0].length).trim();
  return { body, tail };
}
