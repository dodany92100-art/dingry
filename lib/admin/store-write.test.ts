import { describe, expect, it } from "vitest";
import { isStoreWriteConflict, StoreConflictError } from "@/lib/admin/store";

describe("isStoreWriteConflict", () => {
  it("accepte StoreConflictError", () => {
    expect(isStoreWriteConflict(new StoreConflictError())).toBe(true);
  });

  it("refuse les autres erreurs (pas de retry)", () => {
    expect(isStoreWriteConflict(new Error("network"))).toBe(false);
    expect(isStoreWriteConflict(new TypeError("quota"))).toBe(false);
    expect(isStoreWriteConflict(null)).toBe(false);
  });
});
