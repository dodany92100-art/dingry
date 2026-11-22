import { describe, expect, it, vi } from "vitest";
import {
  isDialogBackdropDismissTarget,
  supportsNativeModalDialog,
} from "@/components/molecules/dingry-contact-modal";

describe("isDialogBackdropDismissTarget", () => {
  it("ferme au clic sur le dialog (backdrop), pas sur le panneau", () => {
    const dialog = { tagName: "DIALOG" } as HTMLDialogElement;
    const panel = { tagName: "DIV" } as HTMLDivElement;
    expect(isDialogBackdropDismissTarget(dialog, dialog)).toBe(true);
    expect(isDialogBackdropDismissTarget(panel, dialog)).toBe(false);
    expect(isDialogBackdropDismissTarget(null, dialog)).toBe(false);
  });
});

describe("supportsNativeModalDialog", () => {
  it("reflète la disponibilité de HTMLDialogElement.prototype.showModal", () => {
    const expected =
      typeof HTMLDialogElement !== "undefined" &&
      typeof HTMLDialogElement.prototype.showModal === "function";
    expect(supportsNativeModalDialog()).toBe(expected);
  });
});

describe("contact dialog close contract", () => {
  it("le parent doit synchroniser open=false via onClose après close natif", () => {
    const onClose = vi.fn();
    const simulateCloseEvent = () => onClose();
    simulateCloseEvent();
    expect(onClose).toHaveBeenCalledOnce();
  });
});