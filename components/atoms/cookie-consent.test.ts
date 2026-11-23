import { describe, expect, it, vi } from "vitest";
import { supportsNativeModalDialog } from "@/components/molecules/dingry-native-dialog";
import {
  COOKIE_CONSENT_INTERCEPTS_DIALOG_CANCEL,
  closeNativeCookieConsentDialog,
  openNativeCookieConsentDialog,
} from "@/components/atoms/cookie-consent";

describe("cookie consent dialog (native)", () => {
  it("chemin natif disponible si HTMLDialogElement.showModal existe", () => {
    const expected =
      typeof HTMLDialogElement !== "undefined" &&
      typeof HTMLDialogElement.prototype.showModal === "function";
    expect(supportsNativeModalDialog()).toBe(expected);
  });

  it("openNativeCookieConsentDialog appelle show() et jamais showModal()", () => {
    const show = vi.fn();
    const showModal = vi.fn();
    const dialog = {
      open: false,
      show,
      showModal,
      close: vi.fn(),
    } as unknown as HTMLDialogElement;

    openNativeCookieConsentDialog(dialog);

    expect(show).toHaveBeenCalledOnce();
    expect(showModal).not.toHaveBeenCalled();
  });

  it("openNativeCookieConsentDialog ne rappelle pas show() si le dialog est déjà ouvert", () => {
    const show = vi.fn();
    const dialog = {
      open: true,
      show,
      showModal: vi.fn(),
      close: vi.fn(),
    } as unknown as HTMLDialogElement;

    openNativeCookieConsentDialog(dialog);

    expect(show).not.toHaveBeenCalled();
  });

  it("closeNativeCookieConsentDialog ferme seulement si open", () => {
    const close = vi.fn();
    const openDialog = { open: true, show: vi.fn(), close } as unknown as HTMLDialogElement;
    const closedDialog = { open: false, show: vi.fn(), close } as unknown as HTMLDialogElement;

    closeNativeCookieConsentDialog(openDialog);
    closeNativeCookieConsentDialog(closedDialog);

    expect(close).toHaveBeenCalledOnce();
  });

  it("Échap : pas de handler cancel bloquant sur le bandeau natif", () => {
    expect(COOKIE_CONSENT_INTERCEPTS_DIALOG_CANCEL).toBe(false);
  });

  it("choix explicite : accepted/rejected enregistre le consentement", () => {
    const choose = vi.fn();
    choose("accepted");
    choose("rejected");
    expect(choose).toHaveBeenCalledWith("accepted");
    expect(choose).toHaveBeenCalledWith("rejected");
  });
});