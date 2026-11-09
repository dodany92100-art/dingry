/**
 * Dictionnaire officiel — préfixes Smart Collage DINGRY.
 * Chaque déclencheur route vers une case CRM puis est retiré de la valeur finale.
 */

export type SmartCollageRoute =
  | "sku"
  | "story"
  | "size"
  | "color"
  | "material"
  | "grammage"
  | "price"
  | "stock";

/** Espaces optionnels avant / après `:` `：` `- — */
export const ROUTING_SEPARATOR = String.raw`\s*(?:[:：\-.–—])\s*`;

export type SmartCollageRouteEntry = {
  route: SmartCollageRoute;
  /** Libellés humains (doc CRM). */
  triggers: readonly string[];
  /** Pattern début de ligne (préfixe + séparateur optionnel). */
  lineStart: RegExp;
};

/** Feuille de route parseur — variantes historiques + dictionnaire officiel. */
export const SMART_COLLAGE_ROUTING_DICTIONARY: readonly SmartCollageRouteEntry[] = [
  {
    route: "sku",
    triggers: [
      "ref:",
      "réf:",
      "ref.",
      "réf.",
      "reference:",
      "référence:",
    ],
    lineStart: new RegExp(`^(?:réf|référence|ref(?:\\.|erence)?)${ROUTING_SEPARATOR}`, "iu"),
  },
  {
    route: "story",
    triggers: [
      "argu:",
      "argu :",
      "argi:",
      "argi :",
      "zrgi:",
      "zrgi :",
      "ar:",
      "ar :",
      "story:",
      "desc:",
      "argui:",
      "description:",
    ],
    lineStart: new RegExp(
      `^(?:argu\\w*|argi|zrgi|ar|story|desc(?:ription)?|argui|descr[i1l][p]*tions?|dsric?r?i?ptions?)${ROUTING_SEPARATOR}`,
      "iu",
    ),
  },
  {
    route: "size",
    triggers: ["taille:", "tailles:", "t:", "size:", "tzill:"],
    lineStart: new RegExp(`^(?:tailles?|size|tzill)${ROUTING_SEPARATOR}`, "iu"),
  },
  {
    route: "color",
    triggers: ["couleur:", "c:"],
    lineStart: new RegExp(`^(?:couleur)${ROUTING_SEPARATOR}`, "iu"),
  },
  {
    route: "material",
    triggers: ["mat:", "mat :", "matiere:", "matière:", "matiere :"],
    lineStart: new RegExp(`^(?:mat|mati[eè]res?)${ROUTING_SEPARATOR}`, "iu"),
  },
  {
    route: "grammage",
    triggers: [
      "grammage:",
      "gram:",
      "gram :",
      "gramm:",
      "gramme:",
      "grammes:",
      "gsm:",
      "g/m:",
      "g/m2:",
      "g/m²:",
      "densité:",
      "densite:",
      "density:",
      "poids:",
      "g:",
      "g :",
    ],
    lineStart: new RegExp(
      `^(?:grammages?|grammes?|grams?|gsm|g\\s*\\/\\s*m\\s*(?:²|2)?|densit[ée]s?|density|poids)${ROUTING_SEPARATOR}`,
      "iu",
    ),
  },
  {
    route: "price",
    triggers: ["prix:", "p:", "price:"],
    lineStart: new RegExp(`^(?:prix|price)${ROUTING_SEPARATOR}`, "iu"),
  },
  {
    route: "stock",
    triggers: ["qte:", "qté:", "quantité:", "quantite:", "quantity:", "stock:"],
    lineStart: new RegExp(`^(?:qte|qt[eé]|quantit[eé]s?|quantity|stock)${ROUTING_SEPARATOR}`, "iu"),
  },
] as const;

/** `c:` / `p:` / `t:` / `g:` courts (une lettre + séparateur, espaces tolérés). */
const SHORT_ROUTE_LINE = new RegExp(`^(c|p|t|g)${ROUTING_SEPARATOR}(.+)$`, "iu");

export type RoutedCollageLine = {
  route: SmartCollageRoute;
  value: string;
};

export function stripCollageRoutingPrefix(value: string): string {
  let v = value.trim().replace(/^:+\s*/, "").trim();
  v = v.replace(/^c\s*(?:[:：\-.–—])\s*/iu, "").trim();
  v = v.replace(/^p\s*(?:[:\-.–—])\s*(?=\d)/iu, "").trim();
  v = v
    .replace(/^(?:argu\w*|argi|zrgi|ar|story|desc(?:ription)?|argui)\s*(?:[:\-.–—])\s*/iu, "")
    .replace(/^(?:réf|référence|ref(?:\.|erence)?)\s*(?:[:\-.–—])\s*/iu, "")
    .replace(/^(?:tailles?|size|tzill)\s*(?:[:：\-.–—])\s*/iu, "")
    .replace(/^(?:mat|mati[eè]res?)\s*(?:[:：\-.–—])\s*/iu, "")
    .replace(/^(?:couleur)\s*(?:[:\-.–—])\s*/iu, "")
    .replace(
      /^(?:grammages?|grammes?|grams?|gsm|g\s*\/?\s*m\s*(?:²|2)?|densit[ée]s?|density|poids)\s*(?:[:\-.–—])\s*/iu,
      "",
    )
    .replace(/^g\s*(?:[:\-.–—])\s*(?=\d)/iu, "")
    .replace(/^(?:prix|price)\s*(?:[:\-.–—])\s*/iu, "")
    .replace(/^(?:qte|qt[eé]|quantit[eé]s?|quantity|stock)\s*(?:[:：\-.–—])\s*/iu, "")
    .replace(/^t\s*(?:[:\-.–—])\s*(?=(?:2[8-9]|3[0-9]|4[0-2])\b)/iu, "")
    .trim();
  return v.replace(/^:+\s*/, "").trim();
}

function routeFromShortKey(key: string): SmartCollageRoute | null {
  switch (key.toLowerCase()) {
    case "c":
      return "color";
    case "p":
      return "price";
    case "t":
      return "size";
    case "g":
      return "grammage";
    default:
      return null;
  }
}

/** Routage strict début de ligne (`ref:`, `argu:`, `c:`, `t:`, …). */
function routedValueAfterPrefix(line: string, entry: SmartCollageRouteEntry): string {
  return stripCollageRoutingPrefix(line.replace(entry.lineStart, "").trim());
}

export function parseOfficialRoutingLine(line: string): RoutedCollageLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  for (const entry of SMART_COLLAGE_ROUTING_DICTIONARY) {
    if (!entry.lineStart.test(trimmed)) continue;
    const value = routedValueAfterPrefix(trimmed, entry);
    if (!value && entry.route !== "material" && entry.route !== "story") return null;
    return { route: entry.route, value };
  }

  const short = trimmed.match(SHORT_ROUTE_LINE);
  if (short?.[1] && short[2]) {
    const route = routeFromShortKey(short[1]);
    if (route) {
      return { route, value: stripCollageRoutingPrefix(short[2]) };
    }
  }

  return null;
}
