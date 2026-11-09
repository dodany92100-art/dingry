import { describe, expect, it } from "vitest";
import { parseSmartProductText } from "@/lib/admin/smart-product-text-parser";

describe("parseSmartProductText — algorithme collage", () => {
  it("catégorie + MAJUSCULE + prix € + % + g/m + argu", () => {
    const raw = `catégorie Hoodies
HOODIE DINGRY SIGNATURE
70 % coton, 30 % polyester. Densité 440 g/m?
Prix : 80 €
Couleur : noir
Tailles : S M L XL 2XL
argu :Conçu dans un tissu épais premium pour le quotidien.`;

    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.detectedCategory).toBe("Hoodies");
    expect(r.name).toBe("HOODIE DINGRY SIGNATURE");
    expect(r.price).toBe("80");
    expect(r.sizes).toEqual(["S", "M", "L", "XL", "2XL"]);
    expect(r.weight).toContain("440 g/m²");
    expect(r.materials).toContain("%");
    expect(r.variantColor).toBe("NOIR");
    expect(r.description).toContain("tissu épais premium");
  });

  it("jogpant — Matière / Grammage sur lignes séparées + 440g/m2", () => {
    const raw = `Jogpant Signature
PANTS
DINGRY Heavyweight
Matière
70% coton peigné filé à l'anneau, 20% polyester, 10 % polyester recyclé
Grammage
440g/m2
argu :Le jogpant Signature Heavyweight DINGRY associe coupe oversize, jambes droites et ourlets ouverts.`;

    const r = parseSmartProductText(raw, "Crewnecks");
    expect(r.detectedCategory).toBe("Pants");
    expect(r.materials).toContain("70% coton");
    expect(r.weight).toBe("440 g/m²");
    expect(r.description).toContain("jogpant Signature");
    expect(r.name).not.toBe("PANTS");
  });

  it("fiche fournisseur — REF/ARGU/COULEUR majuscules, @ mat: et .# prix:", () => {
    const raw = `REF :Jogpant Signature
DINGRY Heavyweight
Matière
70% coton peigné filé à l'anneau, 20% polyester, 10 % polyester recyclé
Grammage
440g/m2
ARGU :Le jogpant Signature Heavyweight DINGRY associe coupe oversize, jambes droites et ourlets ouverts pour un look moderne. Conçu avec une face extérieure @   mat: 100 % coton et un intérieur gratté confortable, il dispose d'une ceinture élastique avec cordon de serrage et de poches pratiques. Un patch tissé cousu avec le logo X apporte la touche signature DINGRY/ROCKTHESTREET.# prix: 89e COULEUR : noir`;

    const r = parseSmartProductText(raw, "Pants");
    expect(r.name).toBe("Jogpant Signature");
    expect(r.materials).toContain("70% coton");
    expect(r.weight).toBe("440 g/m²");
    expect(r.price).toBe("89");
    expect(r.variantColor).toBe("NOIR");
    expect(r.description).toContain("coupe oversize");
    expect(r.description).not.toMatch(/mat\s*:|prix\s*:|@\s*mat/i);
  });

  it("argu crewneck + composition collée sans saut de ligne", () => {
    const raw = `Col ras du cou. Pour un confort duveteux et douillet.
Le tissu pré-rétréci en coton/polyester reste confortable et présente moins de bouloches.50% Coton, 50% polaire polyester`;
    const r = parseSmartProductText(raw, "Pants");
    expect(r.materials).toContain("50% Coton");
    expect(r.description).toContain("Col ras du cou");
    expect(r.description).not.toContain("50% Coton");
  });

  it("zrgi + stop-tag findargumentaire + prix inline", () => {
    const raw =
      "zrgi : Superbe sweat oversize en coton bio lourd # findargumentaire @ prix: 45€";
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.description).toBe("Superbe sweat oversize en coton bio lourd");
    expect(r.description).not.toMatch(/findargumentaire|zrgi/i);
    expect(r.price).toBe("45");
  });

  it("matière coupée par # fin de matier @", () => {
    const raw = `matière
70% coton, 30% polyester # fin de matier @
gram: 400`;
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.materials).toContain("70% coton");
    expect(r.materials).not.toMatch(/fin de matier/i);
    expect(r.weight).toContain("400");
  });

  it("FIN DE ARGU clôture le bloc story multiligne", () => {
    const raw = `story: Ligne un
ligne deux
FIN DE ARGU
prix: 60`;
    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.description).toContain("Ligne un");
    expect(r.description).toContain("ligne deux");
    expect(r.description).not.toMatch(/fin de argu/i);
    expect(r.price).toBe("60");
  });

  it("qte / qté / quantité → stock", () => {
    expect(parseSmartProductText("qte : 42\nprix: 50", "T-shirts").stock).toBe("42");
    expect(parseSmartProductText("qté: 7", "T-shirts").stock).toBe("7");
    expect(parseSmartProductText("quantité : 120", "Hoodies").filled).toContain("stock");
  });

  it("alias courts — espaces autour de : (gram, t, mat, size)", () => {
    const r = parseSmartProductText(
      `gram  : 400
t : M
size : L
mat : 70% coton peigné # fin de matier @`,
      "T-shirts",
    );
    expect(r.weight).toBe("400 g/m²");
    expect(r.sizes).toEqual(expect.arrayContaining(["M", "L"]));
    expect(r.materials).toContain("70% coton");
    expect(r.materials).not.toMatch(/\bmat\s*:/i);
  });

  it("argi : avec espaces — story sans préfixe", () => {
    const r = parseSmartProductText("argi : pitch produit # findargumentaire @", "T-shirts");
    expect(r.description).toBe("pitch produit");
    expect(r.description).not.toMatch(/argi\s*:/i);
  });

  it("argu: sans fuite du préfixe dans la description", () => {
    const r = parseSmartProductText("argu: mon argumentaire stylé", "T-shirts");
    expect(r.description).toBe("mon argumentaire stylé");
    expect(r.description).not.toMatch(/^argu\b/i);
    expect(r.description).not.toContain("argu:");
  });

  it("grammage — variantes gram / densité / g/m / g:", () => {
    const cases = [
      ["gram: 400", "400 g/m²"],
      ["gramme: 257", "257 g/m²"],
      ["densité: 440 g/m2", "440 g/m²"],
      ["g/m: 320", "320 g/m²"],
      ["g: 480", "480 g/m²"],
      ["Grammage 257 g/m", "257 g/m²"],
    ] as const;
    for (const [line, expected] of cases) {
      const r = parseSmartProductText(line, "Hoodies");
      expect(r.weight, line).toContain(expected.replace(" g/m²", ""));
      expect(r.weight, line).toMatch(/g\/m²/);
    }
  });

  it("dictionnaire officiel — ref/argu/taille/couleur/gsm/p", () => {
    const raw = `réf: dingry-jog-01
argu: Argumentaire boutique
Taille: m
couleur: NOIR
gsm: 440
p: 89`;
    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.sku).toBe("DINGRY-JOG-01");
    expect(r.description).toBe("Argumentaire boutique");
    expect(r.sizes).toEqual(["M"]);
    expect(r.variantColor).toBe("NOIR");
    expect(r.weight).toBe("440 g/m²");
    expect(r.price).toBe("89");
    expect(r.description).not.toMatch(/argu\s*:/i);
    expect(r.sku).not.toMatch(/réf/i);
  });

  it("ref: → SKU ; ref sans : → titre (legacy)", () => {
    const titled = parseSmartProductText("ref DINGRY SIGNATURE\nprix: 75", "Hoodies");
    expect(titled.name).toBe("DINGRY SIGNATURE");
    expect(titled.sku).toBeUndefined();

    const skued = parseSmartProductText("ref: DINGRY-PT-01", "Pants");
    expect(skued.sku).toBe("DINGRY-PT-01");
    expect(skued.name).toBeUndefined();
  });

  it("ref: libellé produit → nom (ex. Jogpant Signature)", () => {
    const r = parseSmartProductText(
      `ref: Jogpant Signature\nPANTS\nargu: coupe oversize`,
      "Pants",
    );
    expect(r.name).toBe("Jogpant Signature");
    expect(r.sku).toBeUndefined();
    expect(r.description).toContain("coupe oversize");
  });

  it("c: et t: — routage court", () => {
    const r = parseSmartProductText("c: BLANC\nt: 40", "Pants");
    expect(r.variantColor).toBe("BLANC");
    expect(r.sizes).toEqual(["40"]);
  });

  it("prix label sans symbole €", () => {
    const r = parseSmartProductText("CREWNECKS LIGHT\nPrix : 80", "T-shirts");
    expect(r.price).toBe("80");
  });

  it("fiche Produit / Titre / Argui (crewneck)", () => {
    const raw = `Produit : CREWNECKS
Titre Nom CREWNECKS LIGHT
Taille m
50% Coton, 50% polaire polyester
Couleur : Blanc
Grammage 257 g/m
Prix : 80
Argui :Col ras du cou. Pour un confort duveteux et douillet.
Lavable en machine.`;
    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.detectedCategory).toBe("Crewnecks");
    expect(r.name).toBe("CREWNECKS LIGHT");
    expect(r.price).toBe("80");
    expect(r.variantColor).toBe("BLANC");
    expect(r.sizes).toEqual(["M"]);
    expect(r.weight).toContain("257 g/m²");
    expect(r.materials).toContain("50% Coton");
    expect(r.description).toContain("Col ras du cou");
    expect(r.fabrication).toContain("Lavable en machine");
  });

  it("ref + prix souple", () => {
    const raw = `catégorie T-shirts
ref DINGRY SIGNATURE
Noir · 75 eur`;
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.name).toBe("DINGRY SIGNATURE");
    expect(r.price).toBe("75");
    expect(r.detectedCategory).toBe("T-shirts");
  });

  it("note * couleur", () => {
    const raw = `catégorie Hoodies
PULL DINGRY
Tailles S M L
*4XL-5XL COULEUR NOIR
90 €`;
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.variantColor).toBe("NOIR");
    expect(r.sizes).toEqual(["S", "M", "L"]);
    expect(r.price).toBe("90");
  });

  it("texte vide → rien", () => {
    const empty = parseSmartProductText("   ", "T-shirts");
    expect(empty.filled).toEqual([]);
    expect(empty.semanticBlocks).toEqual([]);
  });

  it("catégorie par mot-clé global (HOODIES)", () => {
    const raw = `HOODIES

HOODIE DINGRY SIGNATURE

70 % coton · 80 €`;
    const r = parseSmartProductText(raw, "T-shirts");
    expect(r.detectedCategory).toBe("Hoodies");
    expect(r.name).toBe("HOODIE DINGRY SIGNATURE");
  });

  it("couleur dans le titre (tiret)", () => {
    const r = parseSmartProductText("HOODIE DINGRY SIGNATURE — noir\n80 €", "Hoodies");
    expect(r.variantColor).toBe("NOIR");
  });

  it("paragraphe marketing sans libellé en tête", () => {
    const raw = `Conçu pour le quotidien urbain, coupe droite et confort premium.

HOODIE TEST
80 €`;
    const r = parseSmartProductText(raw, "Hoodies");
    expect(r.description).toContain("quotidien urbain");
    expect(r.name).toBe("HOODIE TEST");
  });

  it("tour pantalon T40 et TZILL 40", () => {
    const t40 = parseSmartProductText("catégorie Pants\nCARGO DINGRY\nT40\n110 €", "T-shirts");
    expect(t40.detectedCategory).toBe("Pants");
    expect(t40.sizes).toEqual(["40"]);

    const tzill = parseSmartProductText(
      "PANTALON CARGO\nTaille : TZILL 42\nPrix 120",
      "Pants",
    );
    expect(tzill.sizes).toEqual(["42"]);
    expect(tzill.name).toBe("PANTALON CARGO");
    expect(tzill.description).toBeUndefined();
  });

  it("blocs sémantiques Maker", () => {
    const r = parseSmartProductText("catégorie Hoodies\nDINGRY SIGNATURE\nPrix : 75", "T-shirts");
    const keys = r.semanticBlocks.map((b) => b.key);
    expect(keys).toContain("category");
    expect(keys).toContain("title");
    expect(keys).toContain("price");
  });
});
