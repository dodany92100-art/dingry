import { z } from "zod";
import { dingrySlugSegment } from "@/lib/catalog/dingry-variant-naming";
import { isProductCategory, type ProductCategory, type ProductSize } from "@/lib/admin/types";

const VAT_FACTOR = 1.2;

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

const productSizeSchema = z.string().trim().min(1).max(8);

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
});

export type CatalogMakerTemplateInput = z.infer<typeof catalogMakerTemplateSchema>;

export function roundPriceHtFromTtc(ttc: number): number {
  return Math.round((ttc / VAT_FACTOR) * 100) / 100;
}

export function makerLabelHintForCategory(category: ProductCategory): string {
  const hints: Partial<Record<ProductCategory, string>> = {
    Hoodies: "HOODIE",
    "Hoodies zippés": "HOODIE ZIPPE",
    Crewnecks: "CREWNECK",
    "T-shirts": "TEE-SHIRT",
    Jerseys: "JERSEY",
    Pants: "PANTS",
    "Crop tops": "CROP TOP",
    Caps: "CAP",
  };
  return hints[category] ?? "MODELE";
}

export function makerTemplateFromFormDefaults(input: {
  label: string;
  category: ProductCategory;
  price: number;
  sizes: readonly ProductSize[];
  sizeGuide?: string;
}): CatalogMakerTemplateInput {
  return {
    label: input.label,
    category: input.category,
    priceTtc: input.price,
    sizes: [...input.sizes],
    sizeGuide: (input.sizeGuide ?? "").trim(),
  };
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
  const ignore = opts?.ignoreId?.trim();
  const duplicate = existing.find((item) => {
    if (ignore && item.id === ignore) return false;
    return item.id === id || normalizeCatalogMakerLabel(item.label) === data.label;
  });
  if (duplicate) {
    return { ok: false, error: `Le modèle « ${duplicate.label} » existe déjà.` };
  }
  return { ok: true, data, id };
}

export function materializeCatalogMakerTemplate(
  draft: CatalogMakerTemplateInput,
  id: string,
  nowIso: string,
): CatalogMakerTemplate {
  const priceHt = draft.priceHt ?? roundPriceHtFromTtc(draft.priceTtc);
  return {
    id,
    label: draft.label,
    category: draft.category,
    priceTtc: draft.priceTtc,
    priceHt,
    sizes: draft.sizes as ProductSize[],
    sizeGuide: draft.sizeGuide?.trim() ?? "",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
