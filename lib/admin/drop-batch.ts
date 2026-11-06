export type DropBatchItemStatus = "published" | "draft";

export type DropBatchItem = {
  id: string;
  displayOrder: number;
  status?: DropBatchItemStatus;
};

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
