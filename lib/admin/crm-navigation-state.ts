import {
  ADMIN_PRODUCT_CATEGORY_NAV,
  type AdminProductCategoryFilter,
} from "@/lib/dingry-product-taxonomy";

export const ADMIN_CRM_SCROLL_KEY = "dingry-admin-crm-scroll";

export type AdminCrmScrollSnapshot = {
  y: number;
  tab: string;
  cat: AdminProductCategoryFilter;
};

export function parseAdminCategoryParam(raw: string | null): AdminProductCategoryFilter {
  if (!raw) return "Collection";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  if ((ADMIN_PRODUCT_CATEGORY_NAV as readonly string[]).includes(decoded)) {
    return decoded as AdminProductCategoryFilter;
  }
  return "Collection";
}

export function adminCategoryQueryValue(cat: AdminProductCategoryFilter): string | null {
  return cat === "Collection" ? null : encodeURIComponent(cat);
}

/** `new` = création · sinon id produit. */
export function parseAdminProductParam(raw: string | null): "new" | string | null {
  const v = raw?.trim() ?? "";
  if (!v) return null;
  if (v === "new") return "new";
  return v;
}

export function saveAdminScrollSnapshot(snapshot: AdminCrmScrollSnapshot): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(ADMIN_CRM_SCROLL_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / mode privé */
  }
}

export function readAdminScrollSnapshot(): AdminCrmScrollSnapshot | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_CRM_SCROLL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminCrmScrollSnapshot;
    if (typeof parsed.y !== "number" || typeof parsed.tab !== "string") return null;
    const cat = parseAdminCategoryParam(parsed.cat);
    return { y: Math.max(0, parsed.y), tab: parsed.tab, cat };
  } catch {
    return null;
  }
}
