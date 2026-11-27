import { describe, expect, it } from "vitest";
import {
  applyLookbookOrderMove,
  defaultLookbookTitleFromFile,
  LOOKBOOK_BATCH_UPLOAD_MAX,
  lookbookBatchCountInvalid,
  validateLookbookOrderedIds,
} from "@/lib/admin/lookbook-limits";

describe("lookbook-limits", () => {
  it("import en lot : max 12 fichiers par sélection", () => {
    expect(LOOKBOOK_BATCH_UPLOAD_MAX).toBe(12);
    expect(lookbookBatchCountInvalid(12)).toBe(false);
    expect(lookbookBatchCountInvalid(13)).toBe(true);
    expect(lookbookBatchCountInvalid(0)).toBe(true);
  });

  it("titre par défaut depuis le nom de fichier", () => {
    expect(defaultLookbookTitleFromFile(new File([], "camp-fw24.webp"), 0)).toBe("camp-fw24");
    expect(defaultLookbookTitleFromFile(new File([], ""), 2)).toBe("Lookbook 3");
  });

  it("déplace un élément dans la liste", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(applyLookbookOrderMove(items, 0, 2)?.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("valide les ids de réordonnancement", () => {
    expect(validateLookbookOrderedIds(["a", "b"], ["a", "b"])).toBeNull();
    expect(validateLookbookOrderedIds(["a"], ["a", "b"])).toMatch(/incorrect/i);
  });
});