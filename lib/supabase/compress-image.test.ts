import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { compressImageToWebp, STORAGE_IMAGE_MAX_BYTES } from "@/lib/supabase/compress-image";

describe("compressImageToWebp", () => {
  it("produit un WebP sous le plafond", async () => {
    const png = await sharp({
      create: { width: 2400, height: 1800, channels: 3, background: { r: 40, g: 40, b: 40 } },
    })
      .png()
      .toBuffer();
    const webp = await compressImageToWebp(png);
    expect(webp.subarray(0, 4).toString()).toBe("RIFF");
    expect(webp.byteLength).toBeLessThanOrEqual(STORAGE_IMAGE_MAX_BYTES);
    const meta = await sharp(webp).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(1800);
  });
});
