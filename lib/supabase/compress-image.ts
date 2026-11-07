import sharp from "sharp";

export const STORAGE_IMAGE_MAX_BYTES = 1_500_000;
const MAX_EDGE = 1800;
const QUALITIES = [80, 72, 64, 56, 48, 40];

export async function compressImageToWebp(input: Buffer): Promise<Buffer> {
  let edge = MAX_EDGE;
  let last = Buffer.alloc(0);

  for (let round = 0; round < 6; round += 1) {
    for (const quality of QUALITIES) {
      last = await sharp(input)
        .rotate()
        .resize({
          width: edge,
          height: edge,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4 })
        .toBuffer();
      if (last.byteLength <= STORAGE_IMAGE_MAX_BYTES) return last;
    }
    edge = Math.max(720, Math.round(edge * 0.82));
  }

  throw new Error("Impossible de compresser cette image sous 1,5 Mo.");
}
