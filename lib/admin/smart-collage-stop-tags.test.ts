import { describe, expect, it } from "vitest";
import { splitAtMaterialStop, splitAtStoryStop } from "@/lib/admin/smart-collage-stop-tags";

describe("smart-collage-stop-tags", () => {
  it("story stop — findargumentaire", () => {
    const { body, tail } = splitAtStoryStop("Texte boutique # findargumentaire @ prix: 1");
    expect(body).toBe("Texte boutique");
    expect(tail).toBe("prix: 1");
  });

  it("matière stop — # fin de matiere (sans @)", () => {
    const { body, tail } = splitAtMaterialStop("70% coton # fin de matiere\ngram: 440");
    expect(body).toBe("70% coton");
    expect(tail).toBe("gram: 440");
  });

  it("matière stop — typo matier @ (rétrocompat)", () => {
    const { body, tail } = splitAtMaterialStop("70% coton # fin de matier @ gsm: 440");
    expect(body).toBe("70% coton");
    expect(tail).toBe("gsm: 440");
  });

  it("matière stop — fin de matiere sans #", () => {
    const { body, tail } = splitAtMaterialStop("100% coton fin de matiere gram: 440");
    expect(body).toBe("100% coton");
    expect(tail).toBe("gram: 440");
  });

  it("story stop — @ avant mat:", () => {
    const { body, tail } = splitAtStoryStop("Face extérieure @   mat: 100 % coton");
    expect(body).toBe("Face extérieure");
    expect(tail).toMatch(/^mat\s*:/i);
  });

  it("story stop — .# avant prix:", () => {
    const { body, tail } = splitAtStoryStop("Texte DINGRY/ROCKTHESTREET.# prix: 89e");
    expect(body).toBe("Texte DINGRY/ROCKTHESTREET");
    expect(tail).toBe("prix: 89e");
  });

  it("story stop — fin d' argu @ (code officiel)", () => {
    const { body, tail } = splitAtStoryStop("Pitch boutique fin d' argu @ mat :");
    expect(body).toBe("Pitch boutique");
    expect(tail).toBe("mat :");
  });

  it("matière stop — # seul en fin de ligne (code squelette)", () => {
    const { body, tail } = splitAtMaterialStop(
      "70 % coton ringspun 20 % polyester 10 % polyester recyclé Heather Grey : 60 % coton 30 % polyester 10 % polyester recyclé#",
    );
    expect(body).toContain("70 % coton");
    expect(body).toContain("Heather Grey");
    expect(body).not.toContain("#");
    expect(tail).toBe("");
  });

  it("story stop — @ en fin de ligne (avec espace)", () => {
    const { body, tail } = splitAtStoryStop(
      "Un essentiel streetwear à porter au quotidien @",
    );
    expect(body).toBe("Un essentiel streetwear à porter au quotidien");
    expect(tail).toBe("");
  });

  it("matière stop — fin de matiere # (code officiel)", () => {
    const { body, tail } = splitAtMaterialStop("100% coton fin de matiere # couleur :");
    expect(body).toBe("100% coton");
    expect(tail).toBe("couleur :");
  });

  it("matière stop — fin matiere @ (squelette NUB)", () => {
    const { body, tail } = splitAtMaterialStop("100% coton fin matiere @ couleur :");
    expect(body).toBe("100% coton");
    expect(tail).toBe("couleur :");
  });

  it("matière stop — fin matiere sans @", () => {
    const { body, tail } = splitAtMaterialStop("100% coton fin matiere\ncouleur :");
    expect(body).toBe("100% coton");
    expect(tail).toBe("couleur :");
  });
});
