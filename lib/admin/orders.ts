import { loadStoreReadOnly } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";

export async function listOrders(): Promise<AdminOrder[]> {
  const store = await loadStoreReadOnly();
  return [...store.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
