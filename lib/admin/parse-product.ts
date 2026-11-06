import { trimStoryField } from "@/lib/admin/product-story";
import {
  isProductCategory,
  isProductSize,
  normalizePrintPlacement,
  normalizeProductCategory,
  normalizePantWaistSize,
  normalizePublishStatus,
  parseColorDeclinations,
  PANT_WAIST_MAX,
  PANT_WAIST_MIN,
  type ProductCategory,
  type ProductPrintPlacement,
  type ProductPublishStatus,
  type ProductSize,
} from "@/lib/admin/types";

export type ParsedProductFields = {
  sku: string;
  name: string;
  variant: string;
  description: string;
  fabrication: string;
  limitedEdition: string;
  materials: string;
  sizeGuide: string;
  printPlacement: ProductPrintPlacement;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  stock: number;
  publishStatus: ProductPublishStatus;
  colorDeclinations?: string[];
};

const STORY_KEYS = ["description", "fabrication", "limitedEdition", "materials", "sizeGuide"] as const;

function parsePrintPlacement(getValue: (key: string) => string): ProductPrintPlacement {
  return normalizePrintPlacement(getValue("printPlacement"));
}

function parseStoryFields(
  getValue: (key: string) => string,
  partial: boolean,
  has: (key: string) => boolean,
  fields: Partial<ParsedProductFields>,
): void {
  for (const key of STORY_KEYS) {
    if (!partial || has(key)) {
      fields[key] = trimStoryField(getValue(key));
    }
  }
}

export function parseSizes(value: string): ProductSize[] | null {
  const sizes = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const waist = normalizePantWaistSize(item);
      if (waist) return waist;
      return item.toUpperCase();
    });
  if (sizes.length === 0 || !sizes.every(isProductSize)) return null;
  return Array.from(new Set(sizes));
}

export function parseProductFields(
  source: FormData | Record<string, unknown>,
  options?: { partial?: boolean },
): { fields: Partial<ParsedProductFields>; error: string | null } {
  const getValue = (key: string): string => {
    if (source instanceof FormData) return String(source.get(key) ?? "");
    const value = source[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
    return "";
  };

  const has = (key: string): boolean => {
    if (source instanceof FormData) return source.has(key);
    return Object.prototype.hasOwnProperty.call(source, key);
  };

  const partial = options?.partial === true;
  const fields: Partial<ParsedProductFields> = {};

  if (!partial || has("sku")) {
    const sku = getValue("sku").trim().slice(0, 32);
    if (sku.length < 2) return { fields, error: "Référence (SKU) invalide." };
    fields.sku = sku.toUpperCase();
  }

  if (!partial || has("name")) {
    const name = getValue("name").trim();
    if (name.length < 2 || name.length > 80) return { fields, error: "Nom du produit invalide." };
    fields.name = name;
  }

  if (!partial || has("variant")) {
    fields.variant = getValue("variant").trim().slice(0, 80);
  } else if (!partial) {
    fields.variant = "";
  }

  if (!partial || STORY_KEYS.some((key) => has(key))) {
    parseStoryFields(getValue, partial, has, fields);
  }

  if (!partial || has("printPlacement")) {
    fields.printPlacement = parsePrintPlacement(getValue);
  }

  if (!partial || has("category")) {
    const category = normalizeProductCategory(getValue("category").trim() || "T-shirts");
    if (!isProductCategory(category)) return { fields, error: "Catégorie invalide." };
    fields.category = category;
  }

  if (!partial || has("price")) {
    const price = Number(getValue("price"));
    if (!Number.isFinite(price) || price <= 0 || price > 10000) {
      return { fields, error: "Prix invalide." };
    }
    fields.price = Math.round(price * 100) / 100;
  }

  if (!partial || has("stock")) {
    const stock = Number(getValue("stock"));
    if (!Number.isInteger(stock) || stock < 0 || stock > 9999) {
      return { fields, error: "Stock invalide." };
    }
    fields.stock = stock;
  }

  if (!partial || has("publishStatus")) {
    fields.publishStatus = normalizePublishStatus(getValue("publishStatus").trim().toLowerCase());
  } else if (!partial) {
    fields.publishStatus = "live";
  }

  if (!partial || has("sizes")) {
    const sizes = parseSizes(getValue("sizes"));
    if (!sizes) {
      const category = fields.category ?? normalizeProductCategory(getValue("category").trim() || "T-shirts");
      const message =
        category === "Pants"
          ? `Sélectionne au moins un tour de taille (${PANT_WAIST_MIN}–${PANT_WAIST_MAX}).`
          : "Sélectionne au moins une taille (S, M, L, XL).";
      return { fields, error: message };
    }
    fields.sizes = sizes;
  }

  if (!partial || has("colorDeclinations")) {
    fields.colorDeclinations = parseColorDeclinations(getValue("colorDeclinations"));
  }

  const resolvedCategory =
    fields.category ?? normalizeProductCategory(getValue("category").trim() || "T-shirts");

  if (resolvedCategory === "Pants" && (!partial || has("variant"))) {
    const rawVariant = fields.variant ?? getValue("variant").trim();
    const waist = normalizePantWaistSize(rawVariant);
    if (!waist) {
      return {
        fields,
        error: `Tour de taille variante invalide (${PANT_WAIST_MIN}–${PANT_WAIST_MAX}).`,
      };
    }
    fields.variant = waist;
  }

  return { fields, error: null };
}
