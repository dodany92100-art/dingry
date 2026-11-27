/** Légende CRM `product:42` ou `42` → ouverture fiche produit. */
export function parseLookbookProductId(caption: string): number | null {
  const trimmed = caption.trim();
  if (!trimmed) return null;
  const tagged = /^product:\s*(\d+)$/i.exec(trimmed);
  if (tagged) {
    const id = Number(tagged[1]);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
  if (/^\d+$/.test(trimmed)) {
    const id = Number(trimmed);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
  return null;
}