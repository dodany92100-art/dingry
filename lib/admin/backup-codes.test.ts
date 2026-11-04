import { describe, expect, it } from "vitest";
import {
  backupCodesStoreState,
  shouldIssueNewBackupCodes,
} from "@/lib/admin/backup-codes";

describe("ensureBackupCodes policy", () => {
  it("ne régénère pas quand hashes est vide (épuisé)", () => {
    expect(backupCodesStoreState({ file: { hashes: [] }, etag: "1" })).toBe("exhausted");
    expect(shouldIssueNewBackupCodes("exhausted")).toBe(false);
  });

  it("génère seulement si jamais initialisé", () => {
    expect(shouldIssueNewBackupCodes("missing")).toBe(true);
    expect(shouldIssueNewBackupCodes("initialized")).toBe(false);
    expect(shouldIssueNewBackupCodes("error")).toBe(false);
  });
});
