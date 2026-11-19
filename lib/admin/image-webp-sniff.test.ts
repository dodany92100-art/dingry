import { describe, expect, it } from "vitest";
import { isWebpBuffer } from "@/lib/admin/image-webp-sniff";

describe("isWebpBuffer", () => {
  it("détecte RIFF…WEBP", () => {
    const buf = Buffer.alloc(16);
    buf.write("RIFF", 0);
    buf.write("WEBP", 8);
    expect(isWebpBuffer(buf)).toBe(true);
  });

  it("rejette un buffer trop court ou incorrect", () => {
    expect(isWebpBuffer(Buffer.from("RIFF"))).toBe(false);
    expect(isWebpBuffer(Buffer.from("PNG\x89"))).toBe(false);
  });
});