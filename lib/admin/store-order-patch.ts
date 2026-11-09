import type { AdminOrder } from "@/lib/admin/types";

function reviewReasonsEqual(
  left: AdminOrder["reviewReasons"],
  right: AdminOrder["reviewReasons"],
): boolean {
  const a = left ?? [];
  const b = right ?? [];
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function stockLinesEqual(
  left: AdminOrder["stockLines"],
  right: AdminOrder["stockLines"],
): boolean {
  const a = left ?? [];
  const b = right ?? [];
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const leftLine = a[i];
    const rightLine = b[i];
    if (!leftLine || !rightLine) return false;
    if (leftLine.productId !== rightLine.productId || leftLine.qty !== rightLine.qty) return false;
  }
  return true;
}

/** Comparaison champ par champ sur le patch (valeurs primitives / références explicites). */
export function orderPatchHasChanges(current: AdminOrder, patch: Partial<AdminOrder>): boolean {
  for (const key of Object.keys(patch) as (keyof AdminOrder)[]) {
    if (key === "reviewReasons") {
      if (!reviewReasonsEqual(current.reviewReasons, patch.reviewReasons)) return true;
      continue;
    }
    if (key === "stockLines") {
      if (!stockLinesEqual(current.stockLines, patch.stockLines)) return true;
      continue;
    }
    if (patch[key] !== current[key]) return true;
  }
  return false;
}
