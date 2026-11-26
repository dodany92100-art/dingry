import { z } from "zod";
import { dingrySlugSegment } from "@/lib/catalog/dingry-variant-naming";
import { PRODUCT_STORY_FIELD_MAX } from "@/lib/admin/product-story";
import {
  DEFAULT_PRODUCT_BRAND,
  DEFAULT_PRODUCT_COLLECTION,
  isProductCategory,
  normalizePrintPlacement,
  normalizeProductBrand,
  normalizeProductCollection,
  type Brand,
  type ProductCategory,
  type ProductCollection,
  type ProductPrintPlacement,
  type ProductSize,
} from "@/lib/admin/types";

const VAT_FACTOR = 1.2;

/** Story + identité produit mémorisée avec le modèle maker (hors visuels / SKU). */
export type CatalogMakerFicheSnapshot = {
  name: string;
  variant: string;
  brand: Brand;
  collection: ProductCollection;
  description: string;
  materials: string;
  fabrication: string;
  limitedEdition: string;
  printPlacement: ProductPrintPlacement;
  colorDeclinations: string[];
  stock: string;
};

export type CatalogMakerTemplate = {
  id: string;
  /** Libellé maker (ex: `HOODIE`, `TEE-SHIRT`) — unique. */
  label: string;
  category: ProductCategory;
  priceTtc: number;
  priceHt: number;
  sizes: ProductSize[];
  /** Grammage indicatif (g/m²) — fiche story. */
  sizeGuide: string;
  /** Champs fiche CRM au moment de « Ajouter au catalogue » (optionnel — rétrocompat). */
  fiche?: CatalogMakerFicheSnapshot;
  createdAt: string;
  updatedAt: string;
};

/** Libellé modèle catalogue — MAJUSCULES, espaces uniques. */
export function normalizeCatalogMakerLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

export function catalogMakerTemplateKey(label: string): string {
  return dingrySlugSegment(normalizeCatalogMakerLabel(label)) || "modele";
}

function normalizeMakerSizesForFingerprint(sizes: readonly string[]): string {
  return [...sizes].map((size) => size.trim()).filter(Boolean).sort().join(",");
}

/** Empreinte contenu (hors libellé) — évite deux modèles strictement identiques. */
export function catalogMakerTemplateFingerprint(
  data: Pick<CatalogMakerTemplateInput, "category" | "priceTtc" | "sizes" | "sizeGuide">,
): string {
  const gram = (data.sizeGuide ?? "").trim().toLowerCase();
  return `${data.category}|${data.priceTtc}|${normalizeMakerSizesForFingerprint(data.sizes)}|${gram}`;
}

export function findCatalogMakerTemplateDuplicate(
  data: CatalogMakerTemplateInput,
  existing: readonly CatalogMakerTemplate[],
  opts?: { ignoreId?: string },
): CatalogMakerTemplate | null {
  const ignore = opts?.ignoreId?.trim();
  const labelNorm = normalizeCatalogMakerLabel(data.label);
  const fingerprint = catalogMakerTemplateFingerprint(data);
  for (const item of existing) {
    if (ignore && item.id === ignore) continue;
    if (item.id === catalogMakerTemplateKey(data.label) || normalizeCatalogMakerLabel(item.label) === labelNorm) {
      return item;
    }
    if (catalogMakerTemplateFingerprint(item) === fingerprint) {
      return item;
    }
  }
  return null;
}

const productSizeSchema = z.string().trim().min(1).max(8);

const storyFieldSchema = z.string().trim().max(PRODUCT_STORY_FIELD_MAX);

export const catalogMakerFicheSchema = z.object({
  name: z.string().trim().max(120).optional().default(""),
  variant: z.string().trim().max(120).optional().default(""),
  brand: z.string().trim().max(48).optional().default(""),
  collection: z.string().trim().max(48).optional().default(""),
  description: storyFieldSchema.optional().default(""),
  materials: storyFieldSchema.optional().default(""),
  fabrication: storyFieldSchema.optional().default(""),
  limitedEdition: storyFieldSchema.optional().default(""),
  printPlacement: z
    .union([z.literal(""), z.literal("RECTO_VERSO"), z.literal("RECTO_ONLY"), z.literal("VERSO_ONLY")])
    .optional()
    .default(""),
  colorDeclinations: z.array(z.string().trim().min(1).max(48)).max(24).optional().default([]),
  stock: z.string().trim().max(8).optional().default(""),
});

export const catalogMakerTemplateSchema = z.object({
  label: z
    .string()
    .transform((value) => normalizeCatalogMakerLabel(value))
    .pipe(z.string().min(2, "Libellé modèle requis.").max(48)),
  category: z
    .string()
    .trim()
    .refine((value): value is ProductCategory => isProductCategory(value), {
      message: "Catégorie boutique invalide.",
    }),
  priceTtc: z.number().finite().positive().max(9_999),
  priceHt: z.number().finite().positive().max(9_999).optional(),
  sizes: z.array(productSizeSchema).min(1, "Au moins une taille."),
  sizeGuide: z.string().trim().max(64).optional().default(""),
  fiche: catalogMakerFicheSchema.optional(),
});

export type CatalogMakerTemplateInput = z.infer<typeof catalogMakerTemplateSchema>;

export function roundPriceHtFromTtc(ttc: number): number {
  return Math.round((ttc / VAT_FACTOR) * 100) / 100;
}

export function makerLabelHintForCategory(category: ProductCategory): string {
  const hints: Partial<Record<ProductCategory, string>> = {
    Hoodies: "HOODIE",
    Hoodzip: "HOODZIP",
    Crewnecks: "CREWNECK",
    "T-shirts": "TEE-SHIRT",
    Jerseys: "JERSEY",
    Pants: "PANTS",
    "Crop tops": "CROP TOP",
    Caps: "CAP",
  };
  return hints[category] ?? "MODELE";
}

export function makerFicheFromFormState(input: {
  name: string;
  variant: string;
  brand: Brand;
  collection: ProductCollection;
  description: string;
  materials: string;
  fabrication: string;
  limitedEdition: string;
  printPlacement: ProductPrintPlacement;
  colorDeclinations: readonly string[];
  stock: string;
}): CatalogMakerFicheSnapshot {
  const colors = input.colorDeclinations.map((c) => c.trim()).filter(Boolean);
  return {
    name: input.name.trim(),
    variant: input.variant.trim(),
    brand: input.brand,
    collection: input.collection,
    description: input.description.trim(),
    materials: input.materials.trim(),
    fabrication: input.fabrication.trim(),
    limitedEdition: input.limitedEdition.trim(),
    printPlacement: normalizePrintPlacement(input.printPlacement),
    colorDeclinations: colors,
    stock: input.stock.trim(),
  };
}

export function makerTemplateFromFormState(input: {
  label: string;
  category: ProductCategory;
  price: number;
  sizes: readonly ProductSize[];
  sizeGuide?: string;
  fiche: CatalogMakerFicheSnapshot;
}): CatalogMakerTemplateInput {
  return {
    label: input.label,
    category: input.category,
    priceTtc: input.price,
    sizes: [...input.sizes],
    sizeGuide: (input.sizeGuide ?? "").trim(),
    fiche: input.fiche,
  };
}

/** @deprecated Préférer `makerTemplateFromFormState` (fiche complète). */
export function makerTemplateFromFormDefaults(input: {
  label: string;
  category: ProductCategory;
  price: number;
  sizes: readonly ProductSize[];
  sizeGuide?: string;
}): CatalogMakerTemplateInput {
  return makerTemplateFromFormState({
    ...input,
    fiche: makerFicheFromFormState({
      name: "",
      variant: "",
      brand: DEFAULT_PRODUCT_BRAND,
      collection: DEFAULT_PRODUCT_COLLECTION,
      description: "",
      materials: "",
      fabrication: "",
      limitedEdition: "",
      printPlacement: "",
      colorDeclinations: [],
      stock: "",
    }),
  });
}

export function catalogMakerTemplateOptionLabel(template: CatalogMakerTemplate): string {
  const gram = (template.sizeGuide ?? "").trim();
  return gram
    ? `${template.label} · ${template.priceTtc} € · ${gram} · ${template.category}`
    : `${template.label} · ${template.priceTtc} € · ${template.category}`;
}

export type MakerTemplateValidationResult =
  | { ok: true; data: CatalogMakerTemplateInput; id: string }
  | { ok: false; error: string };

export function validateCatalogMakerTemplate(
  raw: unknown,
  existing: readonly CatalogMakerTemplate[],
  opts?: { ignoreId?: string },
): MakerTemplateValidationResult {
  const parsed = catalogMakerTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Modèle catalogue invalide." };
  }
  const data = parsed.data;
  const id = catalogMakerTemplateKey(data.label);
  const duplicate = findCatalogMakerTemplateDuplicate(data, existing, { ignoreId: opts?.ignoreId });
  if (duplicate) {
    const sameLabel = normalizeCatalogMakerLabel(duplicate.label) === data.label;
    return {
      ok: false,
      error: sameLabel
        ? `Le modèle « ${duplicate.label} » existe déjà.`
        : `Un modèle identique existe déjà (« ${duplicate.label} » — même catégorie, prix, tailles et grammage).`,
    };
  }
  return { ok: true, data, id };
}

function materializeMakerFiche(
  raw: z.infer<typeof catalogMakerFicheSchema> | undefined,
): CatalogMakerFicheSnapshot | undefined {
  if (!raw) return undefined;
  const hasContent =
    raw.name.length > 0 ||
    raw.variant.length > 0 ||
    raw.description.length > 0 ||
    raw.materials.length > 0 ||
    raw.fabrication.length > 0 ||
    raw.limitedEdition.length > 0 ||
    raw.colorDeclinations.length > 0 ||
    raw.stock.length > 0 ||
    raw.printPlacement.length > 0;
  if (!hasContent && !raw.brand && !raw.collection) return undefined;
  return {
    name: raw.name,
    variant: raw.variant,
    brand: normalizeProductBrand(raw.brand),
    collection: normalizeProductCollection(raw.collection),
    description: raw.description,
    materials: raw.materials,
    fabrication: raw.fabrication,
    limitedEdition: raw.limitedEdition,
    printPlacement: raw.printPlacement,
    colorDeclinations: [...raw.colorDeclinations],
    stock: raw.stock,
  };
}

export function materializeCatalogMakerTemplate(
  draft: CatalogMakerTemplateInput,
  id: string,
  nowIso: string,
): CatalogMakerTemplate {
  const priceHt = draft.priceHt ?? roundPriceHtFromTtc(draft.priceTtc);
  const fiche = materializeMakerFiche(draft.fiche);
  return {
    id,
    label: draft.label,
    category: draft.category,
    priceTtc: draft.priceTtc,
    priceHt,
    sizes: draft.sizes as ProductSize[],
    sizeGuide: draft.sizeGuide?.trim() ?? "",
    ...(fiche ? { fiche } : {}),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function parseCatalogMakerFicheSnapshot(raw: unknown): CatalogMakerFicheSnapshot | undefined {
  const parsed = catalogMakerFicheSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  return materializeMakerFiche(parsed.data);
}
