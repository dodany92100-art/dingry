import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ProductCategory } from "@/lib/admin/types";
import { parseSmartProductText } from "@/lib/admin/smart-product-text-parser";

type AlbumCase = {
  id: string;
  fallbackCategory: ProductCategory;
  raw: string;
  expect: {
    detectedCategory?: ProductCategory;
    name?: string;
    price?: string;
    sizes?: string[];
    variantColor?: string;
    description?: string;
    fabrication?: string;
    filledIncludes?: string[];
    filledEmpty?: boolean;
    semanticKeys?: string[];
    titleValue?: string;
  };
};

type AlbumFile = {
  version: number;
  cases: AlbumCase[];
};

const albumPath = path.join(process.cwd(), "data/fixtures/smart-collage-album.json");

function loadAlbum(): AlbumFile {
  const parsed = JSON.parse(readFileSync(albumPath, "utf8")) as AlbumFile;
  if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    throw new Error("smart-collage-album.json : cases[] vide");
  }
  return parsed;
}

describe("smart-collage-album (parseur béton)", () => {
  const album = loadAlbum();

  it.each(album.cases.map((c) => [c.id, c] as const))("%s · sans erreur", (_id, testCase) => {
    expect(() => parseSmartProductText(testCase.raw, testCase.fallbackCategory)).not.toThrow();
    const r = parseSmartProductText(testCase.raw, testCase.fallbackCategory);
    const e = testCase.expect;

    if (e.filledEmpty) {
      expect(r.filled).toEqual([]);
      expect(r.semanticBlocks).toEqual([]);
      return;
    }

    if (e.detectedCategory !== undefined) expect(r.detectedCategory).toBe(e.detectedCategory);
    if (e.name !== undefined) expect(r.name).toBe(e.name);
    if (e.price !== undefined) expect(r.price).toBe(e.price);
    if (e.sizes !== undefined) expect(r.sizes).toEqual(e.sizes);
    if (e.variantColor !== undefined) expect(r.variantColor).toBe(e.variantColor);
    if (e.description !== undefined) expect(r.description).toBe(e.description);
    if (e.fabrication !== undefined) expect(r.fabrication).toBe(e.fabrication);

    if (e.filledIncludes) {
      for (const key of e.filledIncludes) {
        expect(r.filled).toContain(key);
      }
    }

    if (e.semanticKeys) {
      const keys = r.semanticBlocks.map((b) => b.key);
      for (const key of e.semanticKeys) {
        expect(keys).toContain(key);
      }
    }
    if (e.titleValue !== undefined) {
      expect(r.semanticBlocks.find((b) => b.key === "title")?.value).toBe(e.titleValue);
    }
  });
});
