import { describe, expect, it } from "vitest";
import { validateImageFileAsync } from "@/lib/admin/validate-image-file-async";

function fakeWebpFile(size = 100): File {
  const buf = new Uint8Array(32);
  buf.set([0x52, 0x49, 0x46, 0x46], 0);
  buf.set([0x57, 0x45, 0x42, 0x50], 8);
  return new File([buf], "x.webp", { type: "image/webp" });
}

describe("validateImageFileAsync", () => {
  it("accepte un WebP avec bonne signature", async () => {
    expect(await validateImageFileAsync(fakeWebpFile())).toBeNull();
  });

  it("rejette une signature invalide", async () => {
    const file = new File([new Uint8Array(32)], "x.webp", { type: "image/webp" });
    expect(await validateImageFileAsync(file)).toMatch(/signature/i);
  });
});