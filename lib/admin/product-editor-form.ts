import { canonicalColorDeclinationValue } from "@/lib/admin/dingry-color-palette";
import {
  readProductEditorDraft,
  type ProductEditorDraft,
  type ProductEditorDraftForm,
} from "@/lib/admin/product-editor-draft";
import { isPantsCategory } from "@/lib/admin/product-variant-presets";
import { resolveProductSkuForSave, sanitizeSkuFieldInput } from "@/lib/admin/product-sku";
import { createNewProductFormState } from "@/lib/admin/smart-product-auto-attributes";
import {
  type AdminProduct,
  normalizePantWaistSize,
  normalizeProductCategory,
  type ProductPublishStatus,
  type ProductSize,
} from "@/lib/admin/types";
import type { AdminImageUploadResponse } from "@/lib/client/admin-upload-image";

export type ProductEditorFormState = ProductEditorDraftForm;

export type ProductEditorTab = "product" | "story" | "preview";

export type SectionDirtyFlags = {
  general: boolean;
  sizes: boolean;
  price: boolean;
  media: boolean;
  story: boolean;
};

export function colorDeclinationsLabel(colors: readonly string[]): string {
  return colors.map((item) => item.trim()).filter(Boolean).join(", ");
}

export function waistDeclinationsLabel(sizes: readonly string[], variant: string): string {
  if (sizes.length > 0) return sizes.join(", ");
  return variant.trim();
}

/** Tour actif boutique : variante valide dans la grille, sinon le plus petit tour sélectionné. */
export function pickPantActiveVariant(sizes: readonly string[], variant: string): string {
  const current = normalizePantWaistSize(variant.trim());
  if (current && sizes.includes(current)) return current;
  const ordered = sizes
    .map((size) => normalizePantWaistSize(size))
    .filter((size): size is string => size !== null)
    .sort((a, b) => Number(a) - Number(b));
  return ordered[0] ?? "";
}

export function parseWaistDeclinationsInput(raw: string): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const part of raw.split(",")) {
    const waist = normalizePantWaistSize(part);
    if (!waist || seen.has(waist)) continue;
    seen.add(waist);
    next.push(waist);
  }
  return next;
}

export function parseColorDeclinationsInput(raw: string): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const part of raw.split(",")) {
    const color = canonicalColorDeclinationValue(part);
    if (!color) continue;
    const key = color.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(color);
  }
  return next;
}

export function resolvedColorDeclinations(form: ProductEditorFormState): string[] {
  if (isPantsCategory(form.category)) return [];
  const fromForm = form.colorDeclinations.map((item) => item.trim()).filter(Boolean);
  if (fromForm.length > 0) return fromForm;
  const variant = form.variant.trim();
  return variant ? [variant] : [];
}

export function formWithSkuForSave(
  form: ProductEditorFormState,
  existingSkus: readonly string[],
  editingId: string | null,
): ProductEditorFormState {
  return {
    ...form,
    sku: resolveProductSkuForSave(form.category, form.sku, existingSkus, {
      excludeNormalizedSku: editingId ? form.sku : undefined,
    }),
  };
}

export function productEditorFormFrom(
  product: AdminProduct | null,
  opts?: { existingSkus?: readonly string[] },
): ProductEditorFormState {
  if (!product) {
    return createNewProductFormState("T-shirts", opts?.existingSkus ?? []);
  }
  return {
    sku: sanitizeSkuFieldInput(product.sku),
    name: product.name,
    variant: product.variant,
    colorDeclinations: [...product.colorDeclinations],
    description: product.description,
    fabrication: product.fabrication,
    limitedEdition: product.limitedEdition,
    materials: product.materials,
    sizeGuide: product.sizeGuide,
    printPlacement: product.printPlacement,
    category: normalizeProductCategory(product.category),
    price: String(product.price),
    stock: String(product.stock),
    sizes: [...product.sizes],
  };
}

export function sizesEqual(a: readonly ProductSize[], b: readonly ProductSize[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item === b[i]);
}

export function colorDeclinationsEqual(a: readonly string[], b: readonly string[]): boolean {
  const aa = a.map((c) => c.trim()).filter(Boolean);
  const bb = b.map((c) => c.trim()).filter(Boolean);
  if (aa.length !== bb.length) return false;
  return aa.every((c, i) => c.toUpperCase() === bb[i]?.toUpperCase());
}

function formStoryMatchesBaseline(form: ProductEditorFormState, ref: ProductEditorFormState): boolean {
  return (
    form.description.trim() === ref.description.trim() &&
    form.limitedEdition.trim() === ref.limitedEdition.trim() &&
    form.materials.trim() === ref.materials.trim() &&
    form.fabrication.trim() === ref.fabrication.trim() &&
    form.sizeGuide.trim() === ref.sizeGuide.trim()
  );
}

/** Comparaison formulaire ↔ baseline serveur (null = fiche vide création). Hors image. */
export function formStateMatchesBaseline(
  form: ProductEditorFormState,
  baselineProduct: AdminProduct | null,
): boolean {
  const ref = productEditorFormFrom(baselineProduct);
  return (
    form.sku.trim() === ref.sku.trim() &&
    form.name.trim() === ref.name.trim() &&
    form.variant.trim() === ref.variant.trim() &&
    form.category === ref.category &&
    Number(form.price) === Number(ref.price) &&
    Number(form.stock) === Number(ref.stock) &&
    sizesEqual(form.sizes, ref.sizes) &&
    colorDeclinationsEqual(form.colorDeclinations, ref.colorDeclinations) &&
    formStoryMatchesBaseline(form, ref) &&
    form.printPlacement === ref.printPlacement
  );
}

export function sectionDirtyFlags(
  form: ProductEditorFormState,
  baseline: ProductEditorFormState,
  mediaPending: boolean,
): SectionDirtyFlags {
  const pants = isPantsCategory(form.category);
  const general =
    form.category !== baseline.category ||
    form.sku.trim() !== baseline.sku.trim() ||
    form.name.trim() !== baseline.name.trim() ||
    form.printPlacement !== baseline.printPlacement ||
    (!pants &&
      (form.variant.trim() !== baseline.variant.trim() ||
        !colorDeclinationsEqual(form.colorDeclinations, baseline.colorDeclinations)));
  const sizes =
    !sizesEqual(form.sizes, baseline.sizes) ||
    (pants && form.variant.trim() !== baseline.variant.trim());
  const price =
    Number(form.price) !== Number(baseline.price) || Number(form.stock) !== Number(baseline.stock);
  const story = !formStoryMatchesBaseline(form, baseline);
  return { general, sizes, price, media: mediaPending, story };
}

export function hydrateProductEditorModalUi(
  initial: AdminProduct | null,
  existingSkus: readonly string[],
  sessionKey: string,
): Pick<
  ProductEditorDraft,
  | "form"
  | "colorListDraft"
  | "waistListDraft"
  | "editorTab"
  | "smartPasteOpen"
  | "smartPasteText"
  | "imageRectoCleared"
  | "imageVersoCleared"
> {
  const draft = readProductEditorDraft(sessionKey);
  const form = draft?.form ?? productEditorFormFrom(initial, { existingSkus });
  return {
    form,
    colorListDraft:
      draft?.colorListDraft ?? colorDeclinationsLabel(form.colorDeclinations),
    waistListDraft:
      draft?.waistListDraft ?? waistDeclinationsLabel(form.sizes, form.variant),
    editorTab: draft?.editorTab ?? "product",
    smartPasteOpen: draft?.smartPasteOpen ?? true,
    smartPasteText: draft?.smartPasteText ?? "",
    imageRectoCleared: draft?.imageRectoCleared ?? false,
    imageVersoCleared: draft?.imageVersoCleared ?? false,
  };
}

export function appendStoryFields(formData: FormData, form: ProductEditorFormState): void {
  formData.set("description", form.description.trim());
  formData.set("fabrication", form.fabrication.trim());
  formData.set("limitedEdition", form.limitedEdition.trim());
  formData.set("materials", form.materials.trim());
  formData.set("sizeGuide", form.sizeGuide.trim());
  formData.set("printPlacement", form.printPlacement);
}

export function appendPreuploadedImages(
  formData: FormData,
  preuploadedRecto: AdminImageUploadResponse | null,
  preuploadedVerso: AdminImageUploadResponse | null,
): void {
  if (preuploadedRecto?.url) {
    formData.set("imageUrl", preuploadedRecto.url);
    if (preuploadedRecto.pathname) formData.set("imageBlobPathname", preuploadedRecto.pathname);
  }
  if (preuploadedVerso?.url) {
    formData.set("imageBackUrl", preuploadedVerso.url);
    if (preuploadedVerso.pathname) formData.set("imageBackBlobPathname", preuploadedVerso.pathname);
  }
}

export function buildFormDataForScope(
  form: ProductEditorFormState,
  scope: ProductEditorTab,
  imageRecto: File | null,
  imageVerso: File | null,
  publishStatus: ProductPublishStatus,
  pantsVariantOverride?: string,
  preuploadedRecto?: AdminImageUploadResponse | null,
  preuploadedVerso?: AdminImageUploadResponse | null,
): FormData {
  const formData = new FormData();
  if (scope === "product") {
    formData.set("sku", form.sku.trim());
    formData.set("name", form.name.trim());
    formData.set("variant", (pantsVariantOverride ?? form.variant).trim());
    formData.set("category", form.category);
    formData.set("price", form.price);
    formData.set("stock", form.stock.trim());
    formData.set("sizes", form.sizes.join(","));
    formData.set("colorDeclinations", resolvedColorDeclinations(form).join(","));
    formData.set("publishStatus", publishStatus);
    formData.set("printPlacement", form.printPlacement);
    if (imageRecto) formData.set("image", imageRecto);
    else appendPreuploadedImages(formData, preuploadedRecto ?? null, null);
    if (imageVerso) formData.set("imageBack", imageVerso);
    else if (preuploadedVerso) appendPreuploadedImages(formData, null, preuploadedVerso);
    return formData;
  }
  formData.set("publishStatus", publishStatus);
  appendStoryFields(formData, form);
  return formData;
}

export function buildFormDataStoryOnly(
  form: ProductEditorFormState,
  publishStatus?: ProductPublishStatus,
): FormData {
  const formData = new FormData();
  appendStoryFields(formData, form);
  if (publishStatus) formData.set("publishStatus", publishStatus);
  return formData;
}

export function buildFormDataComplete(
  form: ProductEditorFormState,
  imageRecto: File | null,
  imageVerso: File | null,
  publishStatus: ProductPublishStatus,
  pantsVariantOverride?: string,
  preuploadedRecto?: AdminImageUploadResponse | null,
  preuploadedVerso?: AdminImageUploadResponse | null,
): FormData {
  const formData = buildFormDataForScope(
    form,
    "product",
    imageRecto,
    imageVerso,
    publishStatus,
    pantsVariantOverride,
    preuploadedRecto,
    preuploadedVerso,
  );
  appendStoryFields(formData, form);
  return formData;
}
