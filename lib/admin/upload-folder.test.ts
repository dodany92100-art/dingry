import { describe, expect, it } from "vitest";
import { sanitizeAdminUploadFolder } from "@/lib/admin/upload-folder";

describe("sanitizeAdminUploadFolder", () => {
  it("accepte les chemins produits / lookbook / bannière", () => {
    expect(sanitizeAdminUploadFolder("dingry/products/12/recto")).toBe("dingry/products/12/recto");
    expect(sanitizeAdminUploadFolder("/dingry/lookbook/slide-1/")).toBe("dingry/lookbook/slide-1");
    expect(sanitizeAdminUploadFolder("dingry/banner/perso")).toBe("dingry/banner/perso");
  });

  it("rejette traversal et préfixes hors liste", () => {
    expect(sanitizeAdminUploadFolder("dingry/products/../etc/passwd")).toBeNull();
    expect(sanitizeAdminUploadFolder("public/evil")).toBeNull();
    expect(sanitizeAdminUploadFolder("")).toBeNull();
  });
});