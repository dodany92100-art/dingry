import type { StockPendingChanges } from "@/lib/admin/stock-autosave-types";

export function buildStockBatchUpdates(
  pendingChanges: StockPendingChanges,
  stockBaseline: Record<string, number>,
): { id: string; stock: number }[] {
  const updates: { id: string; stock: number }[] = [];
  for (const [id, delta] of Object.entries(pendingChanges)) {
    if (!Number.isInteger(delta) || delta === 0) continue;
    const base = stockBaseline[id];
    if (base === undefined) continue;
    const stock = base + delta;
    if (stock < 0 || stock > 9999) continue;
    if (stock !== base) updates.push({ id, stock });
  }
  return updates;
}

export function hasUnsyncedStock(
  pendingChanges: StockPendingChanges,
  stockBaseline: Record<string, number>,
): boolean {
  return buildStockBatchUpdates(pendingChanges, stockBaseline).length > 0;
}
