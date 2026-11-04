import { BlobPreconditionFailedError } from "@vercel/blob";
import { describe, expect, it } from "vitest";
import { BackupCodesConflictError, isBackupCodesWriteConflict } from "@/lib/admin/backup-codes";

describe("isBackupCodesWriteConflict", () => {
  it("accepte BlobPreconditionFailedError et BackupCodesConflictError", () => {
    expect(isBackupCodesWriteConflict(new BlobPreconditionFailedError())).toBe(true);
    expect(isBackupCodesWriteConflict(new BackupCodesConflictError())).toBe(true);
  });

  it("refuse les autres erreurs (pas de retry)", () => {
    expect(isBackupCodesWriteConflict(new Error("network"))).toBe(false);
    expect(isBackupCodesWriteConflict(new TypeError("quota"))).toBe(false);
    expect(isBackupCodesWriteConflict(null)).toBe(false);
  });
});
