import {
  isProductCategory,
  isProductSize,
  type ProductCategory,
  type ProductSize,
} from "@/lib/admin/types";

export type ParsedProductFields = {
  sku: string;
  name: string;
  variant: string;
  description: string;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  stock: number;
};

export function parseSizes(value: string): ProductSize[] | null {
  const sizes = value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
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
  }

  if (!partial || has("description")) {
    fields.description = getValue("description").trim().slice(0, 280);
  }

  if (!partial || has("category")) {
    const category = getValue("category").trim() || "Tee";
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

  if (!partial || has("sizes")) {
    const sizes = parseSizes(getValue("sizes"));
    if (!sizes) return { fields, error: "Sélectionne au moins une taille (S, M, L, XL)." };
    fields.sizes = sizes;
  }

  return { fields, error: null };
}
