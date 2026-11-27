/** Nombre max de fichiers sélectionnables en un seul import CRM (pas un plafond vitrine). */
export const LOOKBOOK_BATCH_UPLOAD_MAX = 12;

export function lookbookBatchCountInvalid(count: number): boolean {
  return count < 1 || count > LOOKBOOK_BATCH_UPLOAD_MAX;
}

export function defaultLookbookTitleFromFile(file: File, index: number): string {
  const base = file.name.replace(/\.[^.]+$/u, "").trim();
  return base || `Lookbook ${index + 1}`;
}

/** Réordonne localement (optimistic UI) — ne valide pas les ids serveur. */
export function applyLookbookOrderMove<T extends { id: string }>(
  items: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] | null {
  if (fromIndex === toIndex) return [...items];
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return null;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return null;
  next.splice(toIndex, 0, moved);
  return next;
}

export function validateLookbookOrderedIds(
  orderedIds: string[],
  existingIds: readonly string[],
): string | null {
  if (orderedIds.length !== existingIds.length) {
    return "Ordre invalide : nombre de slides incorrect.";
  }
  const set = new Set(existingIds);
  for (const id of orderedIds) {
    if (!set.has(id)) return "Ordre invalide : slide inconnue.";
  }
  return null;
}