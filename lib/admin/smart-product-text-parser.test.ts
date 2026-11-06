import { describe, expect, it } from "vitest";
import { parseSmartProductText } from "@/lib/admin/smart-product-text-parser";

describe("parseSmartProductText", () => {
  it("extrait titre, prix, tailles, matière, description, couleur ; normalise g/m?", () => {
    const raw = `HOODIE DINGRY SIGNATURE — couleur noir

Conçu dans un tissu épais premium pour le quotidien.

70 % coton ringspun, 30 % polyester. Densité 440 g/m?.

Prix : 80 €

Tailles disponibles : S · M · L · XL · 2XL

*4XL-5XL uniquement sur commande — délai 3 semaines`;

    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.detectedCategory).toBe("Hoodies");
    expect(r.name).toBe("HOODIE DINGRY SIGNATURE");
    expect(r.price).toBe("80");
    expect(r.sizes).toEqual(["S", "M", "L", "XL", "2XL"]);
    expect(r.materials).toContain("440 g/m²");
    expect(r.variantColor).toBe("NOIR");
    expect(r.description).toBeTruthy();
    expect(r.filled).toContain("category");
    expect(r.filled).toContain("variant");
  });

  it("XXL normalisé en 2XL", () => {
    const r = parseSmartProductText("Hoodie test\nTailles M XXL XL", "Hoodies");
    expect(r.sizes).toEqual(["M", "XL", "2XL"]);
  });

  it("grille XS↔EU : ignore les chiffres, accepte 4XL* / 5XL*", () => {
    const raw = `XS 40 M 44 L 46 XL 48 2XL 50 3XL 52 4XL* 54 5XL*
56
*4XL-5XL uniquement disponible(s) dans ces couleurs.`;
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.sizes).toEqual(["XS", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]);
  });

  it("crop top + mention « cargo » (poche) → catégorie Crop tops, pas Pants", () => {
    const raw = `Crop top DINGRY signature
Détail poche cargo.
Tailles S M L XL
75 €`;
    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.detectedCategory).toBe("Crop tops");
    expect(r.sizes).toEqual(["S", "M", "L", "XL"]);
  });

  it("détecte les tours de taille pour Pants (ignore lignes *)", () => {
    const raw = `Pantalon cargo
*41–50 : tailles spéciales

Tour 30 et 32 dispo
89 €`;
    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.detectedCategory).toBe("Pants");
    expect(r.sizes).toEqual(["30", "32"]);
    expect(r.price).toBe("89");
    expect(r.filled).toContain("sizes");
  });

  it("Caps : TU + casquette", () => {
    const raw = `CASQUETTE logo
TU
35 €`;
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.detectedCategory).toBe("Caps");
    expect(r.sizes).toEqual(["TU"]);
    expect(r.price).toBe("35");
  });

  it("Heather Grey → preset GRIS CHINÉ", () => {
    const r = parseSmartProductText("T-shirt · Heather Grey\n80 €", "T-shirts");
    expect(r.variantColor).toBe("GRIS CHINÉ");
  });

  it("texte vide → rien", () => {
    const empty = parseSmartProductText("   ", "T-shirts");
    expect(empty.filled).toEqual([]);
    expect(empty.semanticBlocks).toEqual([]);
  });

  it("exponse des blocs sémantiques Maker pour le récap", () => {
    const r = parseSmartProductText("HOODIES\n\nDINGRY SIGNATURE\n\nNoir · 75 €", "T-shirts");
    const keys = r.semanticBlocks.map((b) => b.key);
    expect(keys).toContain("category");
    expect(keys).toContain("title");
    expect(keys).toContain("price");
    const title = r.semanticBlocks.find((b) => b.key === "title");
    expect(title?.value).toBe("DINGRY SIGNATURE");
  });

  it("lit la couleur dans une note * (hors scan tailles)", () => {
    const raw = `Pull
S M L
*4XL-5XL COULEUR NOIR
90 €`;
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.variantColor).toBe("NOIR");
    expect(r.sizes).toEqual(["S", "M", "L"]);
  });

  it("ignore une première ligne catégorie pure pour le nom", () => {
    const raw = `HOODIES

DINGRY SIGNATURE

Noir · 75 €`;
    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.name).toBe("DINGRY SIGNATURE");
    expect(r.detectedCategory).toBe("Hoodies");
    expect(r.price).toBe("75");
  });

  it("ne met pas les lignes prix seules ni footnotes dans la description", () => {
    const raw = `Sweat test

Phrase marketing pour le quotidien.

80 €

*note bas de page`;
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.description).toBe("Phrase marketing pour le quotidien.");
    expect(r.price).toBe("80");
  });

  it("n’inclut pas le titre en double dans la description (variante tiret / tiret cadratin)", () => {
    const raw = `HOODIES

HOODIE DINGRY SIGNATURE

HOODIE DINGRY - SIGNATURE

Texte descriptif unique sans répéter le nom produit.`;
    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.name).toBe("HOODIE DINGRY SIGNATURE");
    expect(r.description).toBe("Texte descriptif unique sans répéter le nom produit.");
  });

  it("ne met pas la grille S–mensurations dans nom, description ni fabrication", () => {
    const raw = `HOODIE DINGRY

S 46 M 48/50 L 50/52

Conçu pour le quotidien urbain.

Fabriqué au Portugal · coupe S 44 selon stock

70 €`;
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.sizes).toEqual(["S", "M", "L"]);
    expect(r.name).toBe("HOODIE DINGRY");
    expect(r.description).toBe("Conçu pour le quotidien urbain.");
    expect(r.fabrication).toBe("Fabriqué au Portugal · coupe selon stock");
  });
});
