import { describe, expect, it } from "vitest";
import { parseSmartProductText } from "@/lib/admin/smart-product-text-parser";
import {
  parseOfficialRoutingLine,
  SMART_COLLAGE_ROUTING_DICTIONARY,
  stripCollageRoutingPrefix,
} from "@/lib/admin/smart-collage-routing";

describe("smart-collage-routing", () => {
  it("expose le dictionnaire officiel (8 routes)", () => {
    const routes = new Set(SMART_COLLAGE_ROUTING_DICTIONARY.map((e) => e.route));
    expect(routes).toEqual(
      new Set(["sku", "story", "size", "color", "material", "grammage", "price", "stock"]),
    );
  });

  it("nettoie les préfixes résiduels", () => {
    expect(stripCollageRoutingPrefix("argu: Texte")).toBe("Texte");
    expect(stripCollageRoutingPrefix("réf: SKU-1")).toBe("SKU-1");
  });

  it("stock — qte / qté / quantité", () => {
    expect(parseOfficialRoutingLine("qte : 24")?.route).toBe("stock");
    expect(parseOfficialRoutingLine("qte : 24")?.value).toBe("24");
    expect(parseOfficialRoutingLine("qté: 8")?.value).toBe("8");
    expect(parseOfficialRoutingLine("quantité : 100")?.value).toBe("100");
    expect(parseOfficialRoutingLine("stock: 0")?.value).toBe("0");
  });

  it("grammage — gram / densité / g:", () => {
    expect(parseOfficialRoutingLine("gram: 440")?.value).toBe("440");
    expect(parseOfficialRoutingLine("densité: 440")?.route).toBe("grammage");
    expect(parseOfficialRoutingLine("g: 500")?.route).toBe("grammage");
  });

  it("parse ardu → story (typo CRM)", () => {
    const r = parseOfficialRoutingLine("ardu : pitch hoodie");
    expect(r?.route).toBe("story");
    expect(r?.value).toBe("pitch hoodie");
  });

  it("parse argi/argu → story", () => {
    const r = parseOfficialRoutingLine("argui: Pitch produit");
    expect(r?.route).toBe("story");
    expect(r?.value).toBe("Pitch produit");
  });

  it("argi : espaces", () => {
    const line = "argi : pitch produit # findargumentaire @";
    const r = parseOfficialRoutingLine(line);
    expect(r?.route).toBe("story");
    expect(r?.value).toContain("pitch");
    const parsed = parseSmartProductText(line, "T-shirts");
    expect(parsed.filled).toContain("description");
    expect(parsed.description).toBe("pitch produit");
  });
});
