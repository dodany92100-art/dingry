import { describe, expect, it } from "vitest";
import { ADMIN_CRM_RELEASE_HISTORY, adminCrmDisplayVersion } from "@/lib/admin/crm-release";
import { sortCrmReleaseHistoryNewestFirst } from "@/lib/admin/crm-release-sort";
import history from "@/lib/admin/crm-release-history.json";

describe("ADMIN_CRM_RELEASE_HISTORY", () => {
  it("charge le JSON et trie du plus récent au plus ancien", () => {
    expect(ADMIN_CRM_RELEASE_HISTORY).toHaveLength(history.length);
    const sorted = sortCrmReleaseHistoryNewestFirst(history);
    expect(ADMIN_CRM_RELEASE_HISTORY.map((e) => e.id)).toEqual(sorted.map((e) => e.id));
    expect(ADMIN_CRM_RELEASE_HISTORY[0]?.versionHint).toBe("232");
    expect(adminCrmDisplayVersion()).toBe("1.2.232");
  });

  it("ids uniques", () => {
    const ids = ADMIN_CRM_RELEASE_HISTORY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});