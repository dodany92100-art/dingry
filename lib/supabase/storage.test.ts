import { describe, expect, it } from "vitest";
import { storageObjectPath } from "@/lib/supabase/storage";

describe("storageObjectPath", () => {
  it("préfixe produits/recto", () => {
    const path = storageObjectPath("products/31/recto", "crop.webp");
    expect(path.startsWith("products/31/recto/")).toBe(true);
    expect(path.endsWith("-crop.webp")).toBe(true);
  });
});
