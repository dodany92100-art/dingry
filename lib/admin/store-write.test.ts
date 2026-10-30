import { BlobPreconditionFailedError } from "@vercel/blob";
import { describe, expect, it } from "vitest";
import { isStoreWriteConflict, StoreConflictError } from "@/lib/admin/store";

describe("isStoreWriteConflict", () => {
  it("accepte BlobPreconditionFailedError et StoreConflictError", () => {
    expect(isStoreWriteConflict(new BlobPreconditionFailedError())).toBe(true);
    expect(isStoreWriteConflict(new StoreConflictError())).toBe(true);
  });

  it("refuse les autres erreurs (pas de retry)", () => {
    expect(isStoreWriteConflict(new Error("network"))).toBe(false);
    expect(isStoreWriteConflict(new Error("precondition failed"))).toBe(false);
    expect(isStoreWriteConflict(new TypeError("quota"))).toBe(false);
    expect(isStoreWriteConflict(null)).toBe(false);
  });
});
