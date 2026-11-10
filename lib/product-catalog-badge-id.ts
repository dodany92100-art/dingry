/** Libellé badge #ID : id fiche catalogue / CRM (Supabase), jamais index de grille ni id recto dérivé. */
export function productCatalogBadgeId(id: string | number): string {
  return String(id).trim();
}
