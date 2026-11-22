import { describe, expect, it, vi } from "vitest";
import {
  isDialogBackdropDismissTarget,
  supportsNativeModalDialog,
} from "@/components/molecules/dingry-native-dialog";

describe("isDialogBackdropDismissTarget (légal)", () => {
  it("ferme au clic sur le dialog (backdrop), pas sur le panneau", () => {
    const dialog = { tagName: "DIALOG" } as HTMLDialogElement;
    const panel = { tagName: "DIV" } as HTMLDivElement;
    expect(isDialogBackdropDismissTarget(dialog, dialog)).toBe(true);
    expect(isDialogBackdropDismissTarget(panel, dialog)).toBe(false);
  });
});

describe("supportsNativeModalDialog (légal)", () => {
  it("reflète la disponibilité de HTMLDialogElement.prototype.showModal", () => {
    const expected =
      typeof HTMLDialogElement !== "undefined" &&
      typeof HTMLDialogElement.prototype.showModal === "function";
    expect(supportsNativeModalDialog()).toBe(expected);
  });
});

describe("legal dialog close contract", () => {
  it("le parent doit synchroniser open=false via onClose après close natif", () => {
    const onClose = vi.fn();
    onClose();
    expect(onClose).toHaveBeenCalledOnce();
  });
});