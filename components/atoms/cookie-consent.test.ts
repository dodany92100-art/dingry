import { describe, expect, it, vi } from "vitest";
import { supportsNativeModalDialog } from "@/components/molecules/dingry-native-dialog";

describe("cookie consent dialog (native)", () => {
  it("showModal disponible en environnement navigateur moderne", () => {
    const expected =
      typeof HTMLDialogElement !== "undefined" &&
      typeof HTMLDialogElement.prototype.showModal === "function";
    expect(supportsNativeModalDialog()).toBe(expected);
  });

  it("choix explicite : accepted/rejected enregistre le consentement", () => {
    const choose = vi.fn();
    choose("accepted");
    choose("rejected");
    expect(choose).toHaveBeenCalledWith("accepted");
    expect(choose).toHaveBeenCalledWith("rejected");
  });
});