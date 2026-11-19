import { describe, expect, it } from "vitest";
import {
  PRODUCT_EDITOR_SPLIT_DEFAULT_PCT,
  readProductEditorSplitPct,
} from "@/components/organisms/admin/product-editor-split-layout";

describe("readProductEditorSplitPct", () => {
  it("retourne la valeur par défaut côté serveur / tests node", () => {
    expect(readProductEditorSplitPct()).toBe(PRODUCT_EDITOR_SPLIT_DEFAULT_PCT);
  });
});