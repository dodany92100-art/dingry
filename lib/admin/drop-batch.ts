export type DropBatchItemStatus = "published" | "draft";

export type DropBatchItem = {
  id: string;
  displayOrder: number;
  status?: DropBatchItemStatus;
};

type CatalogOrderRow = { id: string; displayOrder: number };

/**
 * Aligne le lot CRM sur le catalogue serveur (ignore les ids obsolètes côté client).
 * Permet de valider la grille après un glisser-déposer sans blocage « Mise à jour impossible ».
 */
export function reconcileDropBatchWithCatalog(
  products: readonly CatalogOrderRow[],
  items: readonly DropBatchItem[],
): DropBatchItem[] | null {
  if (products.length === 0) return null;
  const storeIds = new Set(products.map((product) => product.id));
  const patch = new Map<string, DropBatchItem>();
  for (const item of items) {
    const id = String(item.id).trim();
    if (!id || patch.has(id)) return null;
    if (!storeIds.has(id)) continue;
    if (!Number.isFinite(item.displayOrder) || item.displayOrder < 0) return null;
    patch.set(id, item);
  }
  return products.map((product) => {
    const item = patch.get(product.id);
    return {
      id: product.id,
      displayOrder: item?.displayOrder ?? product.displayOrder,
      ...(item?.status ? { status: item.status } : {}),
    };
  });
}

export function normalizeDropBatchItems(raw: unknown): DropBatchItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: DropBatchItem[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== "string") return null;
    const id = record.id.trim();
    if (!id || seen.has(id)) return null;
    seen.add(id);
    const displayOrder = Number(record.displayOrder);
    if (!Number.isFinite(displayOrder) || displayOrder < 0) return null;
    let status: DropBatchItemStatus | undefined;
    if (record.status === "published" || record.status === "draft") {
      status = record.status;
    } else if (record.status !== undefined) {
      return null;
    }
    items.push({
      id,
      displayOrder: Math.floor(displayOrder),
      ...(status ? { status } : {}),
    });
  }
  return items.length > 0 ? items : null;
}
