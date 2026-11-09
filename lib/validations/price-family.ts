import { z } from "zod";
import { dingrySlugSegment } from "@/lib/catalog/dingry-variant-naming";
import { PRODUCT_FAMILY_LABEL } from "@/lib/admin/parse-product-family";
import { isProductCategory, type ProductCategory, type ProductSize } from "@/lib/admin/types";

const VAT_FACTOR = 1.2;

export type PriceFamily = {
  id: string;
  canonicalId: string;
  displayName: string;
  category: ProductCategory;
  modelName: string;
  color: string;
  priceTtc: number;
  priceHt: number;
  sizes: ProductSize[];
  createdAt: string;
  updatedAt: string;
  /** Dernière fiche CRM liée (informatif). */
  sourceProductId?: string;
};

export type PriceFamilyDraft = Pick<
  PriceFamily,
  "displayName" | "category" | "modelName" | "color" | "priceTtc" | "sizes"
> & {
  priceHt?: number;
  sourceProductId?: string;
};

const productSizeSchema = z.string().trim().min(1).max(8);

/** Nom produit CRM uniquement — trim, espaces uniques, MAJUSCULES (familles de prix). */
export function normalizeCrmProductNameField(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

/** @deprecated alias — utiliser `normalizeCrmProductNameField`. */
export const normalizePriceFamilyNameField = normalizeCrmProductNameField;

const crmProductNameSchema = z
  .string()
  .transform((value) => normalizeCrmProductNameField(value))
  .pipe(z.string().min(1, "Nom modèle requis.").max(96));

export const priceFamilyDraftSchema = z.object({
  displayName: z.string().trim().min(2, "Nom de famille requis.").max(120),
  category: z
    .string()
    .trim()
    .refine((value): value is ProductCategory => isProductCategory(value), {
      message: "Catégorie boutique invalide.",
    }),
  modelName: crmProductNameSchema,
  color: z.string().trim().max(48).default(""),
  priceTtc: z
    .number()
    .finite()
    .positive("Le prix TTC doit être strictement positif.")
    .max(9_999),
  priceHt: z.number().finite().positive().max(9_999).optional(),
  sizes: z.array(productSizeSchema).min(1, "Au moins une taille."),
  sourceProductId: z.string().trim().max(64).optional(),
});

export type PriceFamilyDraftInput = z.infer<typeof priceFamilyDraftSchema>;

export function roundPriceHtFromTtc(ttc: number): number {
  return Math.round((ttc / VAT_FACTOR) * 100) / 100;
}

export function normalizePriceFamilyLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/** Clé d’unicité CRM : catégorie + modèle + couleur (casse / espaces ignorés). */
export function priceFamilyIdentityKey(input: {
  category: ProductCategory;
  modelName: string;
  color: string;
}): string {
  return [
    input.category,
    normalizePriceFamilyLabel(input.modelName),
    normalizePriceFamilyLabel(input.color),
  ].join("|");
}

export function buildPriceFamilyCanonicalId(input: {
  category: ProductCategory;
  modelName: string;
  color: string;
}): string {
  const family = dingrySlugSegment(PRODUCT_FAMILY_LABEL[input.category] ?? input.category);
  const model = dingrySlugSegment(input.modelName);
  const color = dingrySlugSegment(input.color);
  const parts = [family, model, color].filter(Boolean);
  return parts.join("-") || "famille";
}

export function buildPriceFamilyDisplayName(modelName: string, color: string): string {
  const name = modelName.trim();
  const c = color.trim();
  if (!c) return name;
  if (normalizePriceFamilyLabel(name).includes(normalizePriceFamilyLabel(c))) return name;
  return `${name} ${c}`.trim();
}

export function priceFamilyDraftFromProductFields(input: {
  name: string;
  category: ProductCategory;
  variant: string;
  price: number;
  sizes: readonly ProductSize[];
  sourceProductId?: string;
}): PriceFamilyDraftInput {
  const modelName = normalizeCrmProductNameField(input.name);
  const color = input.variant.trim();
  return {
    displayName: buildPriceFamilyDisplayName(modelName, color),
    category: input.category,
    modelName,
    color,
    priceTtc: input.price,
    sizes: [...input.sizes],
    sourceProductId: input.sourceProductId,
  };
}

export type PriceFamilyValidationResult =
  | { ok: true; data: PriceFamilyDraftInput; canonicalId: string; identityKey: string }
  | { ok: false; error: string };

export function validatePriceFamilyDraft(
  raw: unknown,
  existing: readonly PriceFamily[],
  opts?: { ignoreCanonicalId?: string },
): PriceFamilyValidationResult {
  const parsed = priceFamilyDraftSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Famille de prix invalide." };
  }
  const data = parsed.data;
  const canonicalId = buildPriceFamilyCanonicalId(data);
  const identityKey = priceFamilyIdentityKey(data);
  const ignore = opts?.ignoreCanonicalId?.trim();

  const duplicate = existing.find((item) => {
    if (ignore && item.canonicalId === ignore) return false;
    return (
      item.canonicalId === canonicalId ||
      priceFamilyIdentityKey(item) === identityKey ||
      normalizePriceFamilyLabel(item.displayName) === normalizePriceFamilyLabel(data.displayName)
    );
  });

  if (duplicate) {
    return {
      ok: false,
      error: `La famille « ${duplicate.displayName} » existe déjà.`,
    };
  }

  return { ok: true, data, canonicalId, identityKey };
}

export function materializePriceFamily(
  draft: PriceFamilyDraftInput,
  canonicalId: string,
  nowIso: string,
): PriceFamily {
  const priceHt = draft.priceHt ?? roundPriceHtFromTtc(draft.priceTtc);
  return {
    id: canonicalId,
    canonicalId,
    displayName: draft.displayName,
    category: draft.category,
    modelName: draft.modelName,
    color: draft.color,
    priceTtc: draft.priceTtc,
    priceHt,
    sizes: draft.sizes as ProductSize[],
    createdAt: nowIso,
    updatedAt: nowIso,
    ...(draft.sourceProductId ? { sourceProductId: draft.sourceProductId } : {}),
  };
}
