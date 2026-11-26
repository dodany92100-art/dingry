import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const heroPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "shop-hero.tsx");

describe("ShopHero LCP image", () => {
  it("déclare priority + fetchPriority high sur l’image hero", () => {
    const source = readFileSync(heroPath, "utf8");
    expect(source).toMatch(/\bpriority\b/);
    expect(source).toMatch(/fetchPriority=\{index === 0 \? "high" : "auto"\}/);
  });
});