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
