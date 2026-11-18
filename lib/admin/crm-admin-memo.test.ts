import { describe, expect, it } from "vitest";
import { formatCrmAdminProductMemoLine } from "@/lib/admin/crm-admin-memo";

describe("formatCrmAdminProductMemoLine", () => {
  it("formate id, nom et sku", () => {
    expect(
      formatCrmAdminProductMemoLine({ id: "42", name: "Hoodie noir", sku: "DINGRY-H01" }),
    ).toBe("#42 · Hoodie noir (DINGRY-H01)");
  });
});