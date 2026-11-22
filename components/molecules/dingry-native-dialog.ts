/** Helpers partagés modales `<dialog>` (pilote contact + légal). */

export const DINGRY_MODAL_PANEL_TRANSITION = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const DINGRY_NATIVE_DIALOG_CLASS =
  "dingry-contact-native-dialog fixed inset-0 z-[70] m-0 flex h-dvh max-h-dvh w-full max-w-none items-center justify-center border-0 bg-transparent p-4 open:flex md:p-8 [&::backdrop]:animate-[dingry-overlay-in_0.22s_cubic-bezier(0.16,1,0.3,1)_both] [&::backdrop]:bg-[#050505]/92 [&::backdrop]:overscroll-contain";

/** Menu mobile ShopNav : panneau sous la barre, fond transparent (pas d’assombrissement). */
export const DINGRY_NAV_MOBILE_DIALOG_CLASS =
  "dingry-nav-mobile-dialog fixed inset-0 z-[60] m-0 max-h-none max-w-none w-full border-0 bg-transparent p-0 open:block md:hidden [&::backdrop]:bg-transparent [&::backdrop]:overscroll-contain";

export function isDialogBackdropDismissTarget(
  target: EventTarget | null,
  dialog: HTMLDialogElement | null,
): boolean {
  return Boolean(dialog && target === dialog);
}

export function supportsNativeModalDialog(): boolean {
  if (typeof HTMLDialogElement === "undefined") return false;
  return typeof HTMLDialogElement.prototype.showModal === "function";
}