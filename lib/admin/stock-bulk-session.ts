/** Cible lot : ± carte ou saisie se propage à toute la sélection. */
export function shouldPropagateBulkEdit(
  bulkEditActive: boolean,
  productId: string,
  selectedIds: ReadonlySet<string>,
): boolean {
  return bulkEditActive && selectedIds.has(productId) && selectedIds.size > 1;
}

export function selectedProductsForBulk<T extends { id: string }>(
  products: readonly T[],
  selectedIds: ReadonlySet<string>,
): T[] {
  return products.filter((product) => selectedIds.has(product.id));
}