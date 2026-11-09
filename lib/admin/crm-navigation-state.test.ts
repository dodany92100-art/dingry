import { describe, expect, it } from "vitest";
import { adminCategoryQueryValue, parseAdminCategoryParam, parseAdminProductParam } from "@/lib/admin/crm-navigation-state";

describe("parseAdminCategoryParam", () => {
  it("décode Hoodies zippés", () => {
    expect(parseAdminCategoryParam(encodeURIComponent("Hoodies zippés"))).toBe("Hoodies zippés");
  });

  it("défaut Collection", () => {
    expect(parseAdminCategoryParam(null)).toBe("Collection");
    expect(parseAdminCategoryParam("inconnu")).toBe("Collection");
  });
});

describe("adminCategoryQueryValue", () => {
  it("omet Collection", () => {
    expect(adminCategoryQueryValue("Collection")).toBeNull();
    expect(adminCategoryQueryValue("Pants")).toBe("Pants");
  });
});

describe("parseAdminProductParam", () => {
  it("new vs id", () => {
    expect(parseAdminProductParam("new")).toBe("new");
    expect(parseAdminProductParam("abc-12")).toBe("abc-12");
    expect(parseAdminProductParam(null)).toBeNull();
  });
});
