/** Piège Tab partagé (fiche produit, tiroir panier, etc.). */

const SHOP_OVERLAY_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function getShopOverlayFocusableElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(SHOP_OVERLAY_FOCUSABLE_SELECTOR)].filter(
    (el) => !el.hasAttribute("disabled") && !el.closest("[aria-hidden='true']"),
  );
}

export type ShopOverlayTabDirection = "next" | "prev";

export function resolveShopOverlayTabFocus(
  direction: ShopOverlayTabDirection,
  focusables: readonly HTMLElement[],
  active: HTMLElement | null,
): HTMLElement | null {
  if (focusables.length === 0) return null;
  const index = active ? focusables.indexOf(active) : -1;
  if (direction === "next") {
    if (index < 0 || index >= focusables.length - 1) return focusables[0] ?? null;
    return focusables[index + 1] ?? null;
  }
  if (index <= 0) return focusables[focusables.length - 1] ?? null;
  return focusables[index - 1] ?? null;
}

export function shouldTrapShopOverlayTab(
  direction: ShopOverlayTabDirection,
  focusables: readonly HTMLElement[],
  active: HTMLElement | null,
): boolean {
  if (focusables.length === 0) return false;
  const index = active ? focusables.indexOf(active) : -1;
  if (direction === "next") return index === focusables.length - 1 || index < 0;
  return index <= 0;
}