const STORAGE_KEY = "dingry-crm-admin-memo-v1";

export const CRM_ADMIN_MEMO_UPDATED_EVENT = "dingry-crm-admin-memo-updated";

export function readCrmAdminMemo(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeCrmAdminMemo(text: string): void {
  try {
    const trimmed = text.trim();
    if (!trimmed) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function isCrmAdminMemoHidden(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}:hidden`);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

export function persistCrmAdminMemoHidden(hidden: boolean): void {
  try {
    if (hidden) window.localStorage.setItem(`${STORAGE_KEY}:hidden`, "1");
    else window.localStorage.removeItem(`${STORAGE_KEY}:hidden`);
  } catch {
    /* ignore */
  }
}

function notifyCrmAdminMemoUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CRM_ADMIN_MEMO_UPDATED_EVENT));
}

export function formatCrmAdminProductMemoLine(product: {
  id: string | null;
  name: string;
  sku: string;
}): string {
  const name = product.name.trim() || "Sans nom";
  const sku = product.sku.trim();
  const id = product.id ? `#${product.id}` : "Brouillon";
  return sku ? `${id} · ${name} (${sku})` : `${id} · ${name}`;
}

export function appendCrmAdminMemoLine(line: string): void {
  const trimmed = line.trim();
  if (!trimmed) return;
  const current = readCrmAdminMemo();
  const bullet = `• ${trimmed}`;
  if (current.includes(trimmed)) return;
  writeCrmAdminMemo(current ? `${current}\n${bullet}` : bullet);
  notifyCrmAdminMemoUpdated();
}

export function revealCrmAdminMemo(): void {
  persistCrmAdminMemoHidden(false);
  notifyCrmAdminMemoUpdated();
}

/** Ajoute la fiche au mémo post-it et l’affiche. */
export function pinProductToCrmAdminMemo(product: {
  id: string | null;
  name: string;
  sku: string;
}): void {
  appendCrmAdminMemoLine(formatCrmAdminProductMemoLine(product));
  revealCrmAdminMemo();
}