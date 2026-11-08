import { describe, expect, it } from "vitest";
import { StoreConflictError } from "@/lib/admin/store-errors";
import { BackupCodesConflictError, isBackupCodesWriteConflict } from "@/lib/admin/backup-codes";

describe("isBackupCodesWriteConflict", () => {
  it("accepte BackupCodesConflictError et StoreConflictError", () => {
    expect(isBackupCodesWriteConflict(new BackupCodesConflictError())).toBe(true);
    expect(isBackupCodesWriteConflict(new StoreConflictError())).toBe(true);
  });

  it("refuse les autres erreurs (pas de retry)", () => {
    expect(isBackupCodesWriteConflict(new Error("network"))).toBe(false);
    expect(isBackupCodesWriteConflict(null)).toBe(false);
  });
});
