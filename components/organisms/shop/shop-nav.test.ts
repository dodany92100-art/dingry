import { describe, expect, it } from "vitest";

import {
  DINGRY_NAV_MOBILE_DIALOG_CLASS,
  isDialogBackdropDismissTarget,
  supportsNativeModalDialog,
} from "@/components/molecules/dingry-native-dialog";

describe("shop-nav mobile menu dialog", () => {
  it("showModal disponible en environnement navigateur moderne", () => {
    const expected =
      typeof HTMLDialogElement !== "undefined" &&
      typeof HTMLDialogElement.prototype.showModal === "function";
    expect(supportsNativeModalDialog()).toBe(expected);
  });

  it("light dismiss cible uniquement le backdrop du dialog", () => {
    expect(DINGRY_NAV_MOBILE_DIALOG_CLASS).toContain("[&::backdrop]:bg-transparent");
    expect(isDialogBackdropDismissTarget(null, null)).toBe(false);
  });
});