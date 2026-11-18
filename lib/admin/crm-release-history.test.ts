import { describe, expect, it } from "vitest";
import { ADMIN_CRM_RELEASE_HISTORY } from "@/lib/admin/crm-release";
import history from "@/lib/admin/crm-release-history.json";

describe("ADMIN_CRM_RELEASE_HISTORY", () => {
  it("charge le JSON (même longueur, ordre conservé)", () => {
    expect(ADMIN_CRM_RELEASE_HISTORY).toHaveLength(history.length);
    expect(ADMIN_CRM_RELEASE_HISTORY[0]?.id).toBe(history[0]?.id);
  });

  it("ids uniques", () => {
    const ids = ADMIN_CRM_RELEASE_HISTORY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});