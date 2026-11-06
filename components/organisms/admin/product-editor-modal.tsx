"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AdminMediaDropzone } from "@/components/organisms/admin/admin-media-dropzone";
import { AdminProductPreview } from "@/components/organisms/admin/admin-product-preview";
import { AdminSmartCrmBanner } from "@/components/organisms/admin/admin-smart-crm-banner";
import { AdminVariantSwatches } from "@/components/organisms/admin/admin-variant-swatches";
import {
  PrintSizePickerSheet,
  type PrintSizePickerProduct,
} from "@/components/organisms/admin/print-size-picker-sheet";
import {
  ADMIN_VARIANT_PRESETS,
  isPantsCategory,
} from "@/lib/admin/product-variant-presets";
import {
  ADMIN_CATEGORY_SIZES,
  PANT_WAIST_MAX,
  PANT_WAIST_MIN,
  PANT_WAIST_PRESET_SIZES,
  PRODUCT_CATEGORIES,
  normalizePantWaistSize,
  normalizeProductCategory,
  isValidPantWaistSize,
  isDraftPlaceholderImage,
  PRODUCT_PRINT_PLACEMENT_LABELS,
  PRODUCT_PRINT_PLACEMENT_OPTIONS,
  type AdminProduct,
  type ProductCategory,
  type ProductPrintPlacement,
  type ProductPublishStatus,
  type ProductSize,
} from "@/lib/admin/types";
import { EMPTY_PRODUCT_STORY, type ProductStoryFormFields } from "@/lib/admin/product-story";
import { prepareProductImage } from "@/lib/client/prepare-product-image";
import { buildSmartCrmHints, buildSmartDescriptionDraft } from "@/lib/admin/smart-crm";
import {
  buildSmartParseRecap,
  parseSmartProductText,
  summarizeSmartParseFilled,
  type MakerSemanticBlock,
  type SmartParseFieldId,
} from "@/lib/admin/smart-product-text-parser";
import { DEFAULT_SHOP_PRODUCT_STOCK } from "@/lib/shop-data";
import type { SaveProductResult } from "./hooks/use-admin-products";

function colorDeclinationsLabel(colors: readonly string[]): string {
  return colors.map((item) => item.trim()).filter(Boolean).join(", ");
}

function waistDeclinationsLabel(sizes: readonly string[], variant: string): string {
  if (sizes.length > 0) return sizes.join(", ");
  return variant.trim();
}

function parseWaistDeclinationsInput(raw: string): string[] {
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

type FormSuccessState =
  | { kind: "plain"; message: string; tone: "draft" | "live" | "neutral" }
  | {
      kind: "smart-parse";
      tone: "neutral";
      title: string;
      blocks: MakerSemanticBlock[];
      analysisLine: string;
      filledSummary: string;
    };

function parseColorDeclinationsInput(raw: string): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const part of raw.split(",")) {
    const color = part.trim();
    if (!color) continue;
    const key = color.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(color);
  }
  return next;
}

function resolvedColorDeclinations(form: FormState): string[] {
  if (isPantsCategory(form.category)) return [];
  const fromForm = form.colorDeclinations.map((item) => item.trim()).filter(Boolean);
  if (fromForm.length > 0) return fromForm;
  const variant = form.variant.trim();
  return variant ? [variant] : [];
}

type FormState = {
  sku: string;
  name: string;
  variant: string;
  colorDeclinations: string[];
  category: ProductCategory;
  price: string;
  stock: string;
  sizes: ProductSize[];
} & ProductStoryFormFields;

function newProductSku(): string {
  return `DINGRY-N-${Date.now().toString(36).toUpperCase()}`;
}

function formFrom(product: AdminProduct | null): FormState {
  if (!product) {
    return {
      sku: newProductSku(),
      name: "",
      variant: "",
      colorDeclinations: [],
      ...EMPTY_PRODUCT_STORY,
      category: "T-shirts",
      price: "35",
      stock: String(DEFAULT_SHOP_PRODUCT_STOCK),
      sizes: [],
    };
  }
  return {
    sku: product.sku,
    name: product.name,
    variant: product.variant,
    colorDeclinations:
      product.colorDeclinations.length > 0
        ? [...product.colorDeclinations]
        : product.variant.trim()
          ? [product.variant.trim()]
          : [],
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

function sizesEqual(a: readonly ProductSize[], b: readonly ProductSize[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item === b[i]);
}

function colorDeclinationsEqual(a: readonly string[], b: readonly string[]): boolean {
  const aa = a.map((c) => c.trim()).filter(Boolean);
  const bb = b.map((c) => c.trim()).filter(Boolean);
  if (aa.length !== bb.length) return false;
  return aa.every((c, i) => c.toUpperCase() === bb[i].toUpperCase());
}

/** Comparaison formulaire ↔ baseline serveur (null = fiche vide création). Hors image. */
function formStateMatchesBaseline(form: FormState, baselineProduct: AdminProduct | null): boolean {
  const ref = formFrom(baselineProduct);
  return (
    form.sku.trim() === ref.sku.trim() &&
    form.name.trim() === ref.name.trim() &&
    form.variant.trim() === ref.variant.trim() &&
    form.category === ref.category &&
    Number(form.price) === Number(ref.price) &&
    Number(form.stock) === Number(ref.stock) &&
    sizesEqual(form.sizes, ref.sizes) &&
    colorDeclinationsEqual(form.colorDeclinations, ref.colorDeclinations) &&
    form.description.trim() === ref.description.trim() &&
    form.fabrication.trim() === ref.fabrication.trim() &&
    form.limitedEdition.trim() === ref.limitedEdition.trim() &&
    form.materials.trim() === ref.materials.trim() &&
    form.sizeGuide.trim() === ref.sizeGuide.trim() &&
    form.printPlacement === ref.printPlacement
  );
}

type EditorTab = "product" | "story";

function appendStoryFields(formData: FormData, form: FormState): void {
  formData.set("description", form.description.trim());
  formData.set("fabrication", form.fabrication.trim());
  formData.set("limitedEdition", form.limitedEdition.trim());
  formData.set("materials", form.materials.trim());
  formData.set("sizeGuide", form.sizeGuide.trim());
  formData.set("printPlacement", form.printPlacement);
}

function buildFormDataForScope(
  form: FormState,
  scope: EditorTab,
  imageRecto: File | null,
  imageVerso: File | null,
  publishStatus: ProductPublishStatus,
  pantsVariantOverride?: string,
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
    if (imageVerso) formData.set("imageBack", imageVerso);
    return formData;
  }
  formData.set("publishStatus", publishStatus);
  appendStoryFields(formData, form);
  return formData;
}

function buildFormDataStoryOnly(form: FormState, publishStatus?: ProductPublishStatus): FormData {
  const formData = new FormData();
  appendStoryFields(formData, form);
  if (publishStatus) formData.set("publishStatus", publishStatus);
  return formData;
}

function buildFormDataComplete(
  form: FormState,
  imageRecto: File | null,
  imageVerso: File | null,
  publishStatus: ProductPublishStatus,
  pantsVariantOverride?: string,
): FormData {
  const formData = buildFormDataForScope(form, "product", imageRecto, imageVerso, publishStatus, pantsVariantOverride);
  appendStoryFields(formData, form);
  return formData;
}

type ProductEditorModalProps = {
  /** null = création. */
  initial: AdminProduct | null;
  busyProductId: string | null;
  onClose: () => void;
  onSubmit: (editingId: string | null, formData: FormData) => Promise<SaveProductResult>;
  /** Retourne true si le produit a été supprimé (le modal se ferme alors). */
  onDelete: (product: AdminProduct) => Promise<boolean>;
};

export function ProductEditorModal({
  initial,
  busyProductId,
  onClose,
  onSubmit,
  onDelete,
}: ProductEditorModalProps) {
  const [current, setCurrent] = useState<AdminProduct | null>(initial);
  const [form, setForm] = useState<FormState>(() => formFrom(initial));
  const [imageRectoFile, setImageRectoFile] = useState<File | null>(null);
  const [imageVersoFile, setImageVersoFile] = useState<File | null>(null);
  const [imageRectoCleared, setImageRectoCleared] = useState(false);
  const [imageVersoCleared, setImageVersoCleared] = useState(false);
  const [imageRectoPreview, setImageRectoPreview] = useState("");
  const [imageVersoPreview, setImageVersoPreview] = useState("");
  const [convertingRecto, setConvertingRecto] = useState(false);
  const [convertingVerso, setConvertingVerso] = useState(false);
  const convertingImage = convertingRecto || convertingVerso;
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState<FormSuccessState | null>(null);
  const [customPantWaist, setCustomPantWaist] = useState("");
  const [smartPasteOpen, setSmartPasteOpen] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState("");
  const [printSheetOpen, setPrintSheetOpen] = useState(false);
  const [colorListDraft, setColorListDraft] = useState(() =>
    colorDeclinationsLabel(formFrom(initial).colorDeclinations),
  );
  const [waistListDraft, setWaistListDraft] = useState(() => {
    const initialForm = formFrom(initial);
    return waistDeclinationsLabel(initialForm.sizes, initialForm.variant);
  });

  const editingId = current?.id ?? null;

  useEffect(() => {
    if (!imageRectoFile) {
      setImageRectoPreview("");
      return;
    }
    const url = URL.createObjectURL(imageRectoFile);
    setImageRectoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageRectoFile]);

  useEffect(() => {
    if (!imageVersoFile) {
      setImageVersoPreview("");
      return;
    }
    const url = URL.createObjectURL(imageVersoFile);
    setImageVersoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageVersoFile]);

  useEffect(() => {
    setCurrent(initial);
    const nextForm = formFrom(initial);
    setForm(nextForm);
    setColorListDraft(colorDeclinationsLabel(nextForm.colorDeclinations));
    setWaistListDraft(waistDeclinationsLabel(nextForm.sizes, nextForm.variant));
    setImageRectoFile(null);
    setImageVersoFile(null);
    setImageRectoCleared(false);
    setImageVersoCleared(false);
    setFormError("");
    setFormSuccess(null);
    setSmartPasteOpen(false);
    setSmartPasteText("");
    setPrintSheetOpen(false);
  }, [initial]);

  function patch(update: Partial<FormState>) {
    setForm((previous) => ({ ...previous, ...update }));
  }

  function toggleColorDeclination(color: string) {
    const key = color.trim().toUpperCase();
    if (!key) return;
    setForm((previous) => {
      const exists = previous.colorDeclinations.some((item) => item.trim().toUpperCase() === key);
      const next = exists
        ? previous.colorDeclinations.filter((item) => item.trim().toUpperCase() !== key)
        : [...previous.colorDeclinations, color.trim()];
      setColorListDraft(colorDeclinationsLabel(next));
      const variantKey = previous.variant.trim().toUpperCase();
      const nextVariant = exists
        ? variantKey === key
          ? (next[0] ?? "")
          : previous.variant
        : previous.variant.trim()
          ? previous.variant
          : color.trim();
      return { ...previous, colorDeclinations: next, variant: nextVariant };
    });
  }

  function onWaistListDraftChange(raw: string) {
    setWaistListDraft(raw);
    const next = parseWaistDeclinationsInput(raw);
    setForm((previous) => ({
      ...previous,
      sizes: next,
      variant: next.includes(previous.variant) ? previous.variant : (next[0] ?? ""),
    }));
  }

  function onColorListDraftChange(raw: string) {
    setColorListDraft(raw);
    const next = parseColorDeclinationsInput(raw);
    setForm((previous) => ({
      ...previous,
      colorDeclinations: next,
      variant: next[0] ?? "",
    }));
  }

  function showFormSuccess(message: string, tone: "draft" | "live" | "neutral") {
    setFormSuccess({ kind: "plain", message, tone });
  }

  function showSmartPasteSuccess(parsed: ReturnType<typeof parseSmartProductText>) {
    const diag = parsed.diagnostics;
    const analysisLine = `Analyse Maker · ${diag.blockCount} bloc(s) sémantique(s), ${diag.footnoteLinesSkipped} ligne(s) * exclue(s) du scan des tailles. Les grilles taille ne sont pas recopiées dans le titre / la description (fiche boutique).`;
    setFormSuccess({
      kind: "smart-parse",
      tone: "neutral",
      title: "Smart collage · champs appliqués",
      blocks: parsed.semanticBlocks,
      analysisLine,
      filledSummary: summarizeSmartParseFilled(parsed.filled),
    });
  }

  function sizesAllowedForCategory(category: ProductCategory): Set<string> {
    return new Set(ADMIN_CATEGORY_SIZES[category].map((s) => String(s)));
  }

  function filterSizesForCategory(sizes: readonly ProductSize[], category: ProductCategory): ProductSize[] {
    const allowed = sizesAllowedForCategory(category);
    return sizes.filter((s) => allowed.has(String(s)));
  }

  function changeCategory(nextCategory: ProductCategory) {
    setForm((prev) => {
      const nextSizes = filterSizesForCategory(prev.sizes, nextCategory);
      const nowPants = isPantsCategory(nextCategory);
      const wasPants = isPantsCategory(prev.category);

      if (!editingId) {
        setWaistListDraft("");
        setColorListDraft("");
        return {
          ...prev,
          category: nextCategory,
          sizes: nextSizes,
          variant: "",
          colorDeclinations: [],
        };
      }

      if (nowPants) {
        const w = normalizePantWaistSize(prev.variant.trim());
        const nextVariant =
          w && nextSizes.includes(w) ? w : (nextSizes[0] ?? "");
        setWaistListDraft(waistDeclinationsLabel(nextSizes, nextVariant));
        setColorListDraft("");
        return {
          ...prev,
          category: nextCategory,
          sizes: nextSizes,
          variant: nextVariant,
          colorDeclinations: [],
        };
      }

      let nextVariant = prev.variant.trim();
      let nextColors = [...prev.colorDeclinations];

      if (wasPants || isValidPantWaistSize(nextVariant)) {
        nextVariant = nextColors[0] ?? "";
      } else if (
        nextColors.length > 0 &&
        !nextColors.some((c) => c.trim().toUpperCase() === nextVariant.toUpperCase())
      ) {
        nextVariant = nextColors[0] ?? "";
      }

      setWaistListDraft("");
      setColorListDraft(
        colorDeclinationsLabel(
          nextColors.length > 0 ? nextColors : nextVariant ? [nextVariant] : [],
        ),
      );

      return {
        ...prev,
        category: nextCategory,
        sizes: nextSizes,
        variant: nextVariant,
        colorDeclinations: nextColors,
      };
    });
  }

  function toggleSize(size: ProductSize) {
    setForm((previous) => {
      const pants = isPantsCategory(previous.category);
      const seeded =
        pants && previous.sizes.length === 0 ? normalizePantWaistSize(previous.variant) : null;
      const base = seeded ? [seeded] : previous.sizes;
      const exists = base.includes(size);
      const next = exists ? base.filter((item) => item !== size) : [...base, size];
      if (!pants) return { ...previous, sizes: next };
      const variant = next.includes(previous.variant) ? previous.variant : (next[0] ?? "");
      setWaistListDraft(next.join(", "));
      return { ...previous, sizes: next, variant };
    });
  }

  function addCustomPantWaist() {
    setFormError("");
    const waist = normalizePantWaistSize(customPantWaist);
    if (!waist) {
      setFormError(`Tour personnalisé invalide (${PANT_WAIST_MIN}–${PANT_WAIST_MAX}, 2 chiffres).`);
      return;
    }
    setForm((previous) => {
      const next = previous.sizes.includes(waist) ? previous.sizes : [...previous.sizes, waist];
      const variant = next.includes(previous.variant) ? previous.variant : waist;
      setWaistListDraft(next.join(", "));
      return { ...previous, sizes: next, variant: variant || waist };
    });
    setCustomPantWaist("");
  }

  async function acceptImageRecto(selected: File | null) {
    setFormError("");
    setFormSuccess(null);
    if (!selected) {
      setImageRectoFile(null);
      setImageRectoCleared(true);
      return;
    }
    setImageRectoCleared(false);
    setConvertingRecto(true);
    try {
      setImageRectoFile(await prepareProductImage(selected));
    } catch (error) {
      setImageRectoFile(null);
      setFormError(error instanceof Error ? error.message : "Conversion impossible.");
    } finally {
      setConvertingRecto(false);
    }
  }

  async function acceptImageVerso(selected: File | null) {
    setFormError("");
    setFormSuccess(null);
    if (!selected) {
      setImageVersoFile(null);
      setImageVersoCleared(true);
      return;
    }
    setImageVersoCleared(false);
    setConvertingVerso(true);
    try {
      setImageVersoFile(await prepareProductImage(selected));
    } catch (error) {
      setImageVersoFile(null);
      setFormError(error instanceof Error ? error.message : "Conversion impossible.");
    } finally {
      setConvertingVerso(false);
    }
  }

  const [editorTab, setEditorTab] = useState<EditorTab>("product");

  function validateProductFields(publishStatus: ProductPublishStatus): string | null {
    if (convertingImage) return "Conversion de l'image en cours.";
    if (form.name.trim().length < 2) return "Nom du produit requis (2 caractères min.).";
    if (publishStatus === "live") {
      if (!editingId && !imageRectoFile) {
        return "Ajoute une image pour mettre en ligne.";
      }
      const preview = imageRectoCleared ? "" : imageRectoPreview || current?.imageUrl || "";
      if (!imageRectoFile && (!preview || isDraftPlaceholderImage(preview))) {
        return "Ajoute une image pour mettre en ligne.";
      }
    }
    if (!form.variant.trim()) {
      return isPantsCategory(form.category)
        ? "Choisis ou saisis un tour de taille (variante)."
        : "Choisis ou saisis une couleur (variante).";
    }
    if (form.sizes.length === 0) {
      return isPantsCategory(form.category)
        ? "Sélectionne au moins un tour de taille."
        : "Sélectionne au moins une taille.";
    }
    if (isPantsCategory(form.category)) {
      const waist = normalizePantWaistSize(form.variant);
      if (!waist) return `Tour de taille invalide (${PANT_WAIST_MIN}–${PANT_WAIST_MAX}, 2 chiffres).`;
    }
    const stockValue = Number(form.stock);
    if (!Number.isInteger(stockValue) || stockValue < 0 || stockValue > 9999) {
      return "Stock invalide (0–9999).";
    }
    return null;
  }

  async function saveProductTab(publishStatus: ProductPublishStatus) {
    setFormError("");
    setFormSuccess(null);
    const validationError = validateProductFields(publishStatus);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const pantsVariant =
      isPantsCategory(form.category) ? normalizePantWaistSize(form.variant) ?? undefined : undefined;
    setSaving(true);
    const publishBeforeSave = current?.publishStatus;
    if (publishStatus === "live" && editingId) {
      setCurrent((prev) => (prev ? { ...prev, publishStatus: "live" } : prev));
    }
    try {
      const payload = buildFormDataComplete(form, imageRectoFile, imageVersoFile, publishStatus, pantsVariant);
      if (imageRectoCleared && !imageRectoFile) payload.set("clearImage", "1");
      if (imageVersoCleared && !imageVersoFile) payload.set("clearImageBack", "1");
      const result = await onSubmit(editingId, payload);
      if ("error" in result) {
        setFormError(result.error);
        if (publishBeforeSave !== undefined && editingId) {
          setCurrent((prev) => (prev ? { ...prev, publishStatus: publishBeforeSave } : prev));
        }
        return;
      }
      setCurrent(result.product);
      const nextForm = formFrom(result.product);
      setForm(nextForm);
      setColorListDraft(colorDeclinationsLabel(nextForm.colorDeclinations));
      setWaistListDraft(waistDeclinationsLabel(nextForm.sizes, nextForm.variant));
      setImageRectoFile(null);
      setImageVersoFile(null);
      setImageRectoCleared(false);
      setImageVersoCleared(false);
      showFormSuccess(
        publishStatus === "live"
          ? "Produit en ligne sur la boutique."
          : "Brouillon enregistré (invisible sur la boutique).",
        publishStatus === "live" ? "live" : "draft",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveStoryTab(publishStatus: ProductPublishStatus) {
    setFormError("");
    setFormSuccess(null);

    if (!editingId) {
      const validationError = validateProductFields(publishStatus);
      if (validationError) {
        setFormError(validationError);
        setEditorTab("product");
        return;
      }
      const pantsVariant =
        isPantsCategory(form.category) ? normalizePantWaistSize(form.variant) ?? undefined : undefined;
      setSaving(true);
      try {
        const result = await onSubmit(
          null,
          buildFormDataComplete(form, imageRectoFile, imageVersoFile, publishStatus, pantsVariant),
        );
        if ("error" in result) {
          setFormError(result.error);
          return;
        }
        setCurrent(result.product);
        const created = formFrom(result.product);
        setForm(created);
        setColorListDraft(colorDeclinationsLabel(created.colorDeclinations));
        setWaistListDraft(waistDeclinationsLabel(created.sizes, created.variant));
        setImageRectoFile(null);
        setImageVersoFile(null);
        showFormSuccess(
          publishStatus === "live"
            ? "Produit et fiche boutique en ligne."
            : "Brouillon enregistré (invisible sur la boutique).",
          publishStatus === "live" ? "live" : "draft",
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    if (publishStatus === "live") {
      const validationError = validateProductFields("live");
      if (validationError) {
        setFormError(validationError);
        return;
      }
    }
    setSaving(true);
    const publishBeforeStorySave = current?.publishStatus;
    if (publishStatus === "live" && editingId) {
      setCurrent((prev) => (prev ? { ...prev, publishStatus: "live" } : prev));
    }
    try {
      const storyPayload =
        publishStatus === "draft"
          ? buildFormDataStoryOnly(form)
          : buildFormDataStoryOnly(form, "live");
      const result = await onSubmit(editingId, storyPayload);
      if ("error" in result) {
        setFormError(result.error);
        if (publishBeforeStorySave !== undefined) {
          setCurrent((prev) => (prev ? { ...prev, publishStatus: publishBeforeStorySave } : prev));
        }
        return;
      }
      setCurrent(result.product);
      const saved = formFrom(result.product);
      setForm(saved);
      setColorListDraft(colorDeclinationsLabel(saved.colorDeclinations));
      setWaistListDraft(waistDeclinationsLabel(saved.sizes, saved.variant));
      showFormSuccess(
        publishStatus === "live"
          ? "Fiche enregistrée · produit mis en ligne."
          : "Fiche enregistrée · statut publication inchangé.",
        publishStatus === "live" ? "live" : "draft",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!current) return;
    if (await onDelete(current)) onClose();
  }

  const pantsForm = isPantsCategory(form.category);
  const presetPantWaists = PANT_WAIST_PRESET_SIZES as readonly string[];
  const extraPantWaists = pantsForm
    ? form.sizes.filter((size) => !presetPantWaists.includes(size))
    : [];

  const previewRectoSrc = imageRectoFile
    ? imageRectoPreview
    : imageRectoCleared
      ? ""
      : current?.imageUrl ?? "";
  const previewVersoSrc = imageVersoFile
    ? imageVersoPreview
    : imageVersoCleared
      ? ""
      : (current?.imageBackUrl ?? "").trim();
  const hasRealImage =
    Boolean(imageRectoFile) || (previewRectoSrc.length > 0 && !isDraftPlaceholderImage(previewRectoSrc));

  const previewModel = useMemo(
    () => ({
      name: form.name,
      variant: form.variant,
      category: form.category,
      price: form.price,
      sizes: form.sizes,
      description: form.description,
      printPlacement: form.printPlacement,
      imageSrc: previewRectoSrc,
      imageBackSrc: previewVersoSrc,
      publishStatus: (current?.publishStatus ?? "draft") as ProductPublishStatus,
      stock: Number(form.stock) || 0,
    }),
    [form, previewRectoSrc, previewVersoSrc, current?.publishStatus],
  );

  const printPickerProduct: PrintSizePickerProduct = useMemo(
    () => ({
      name: form.name.trim() || current?.name || "Produit",
      variant: form.variant.trim(),
      sku: form.sku.trim(),
      sizes: form.sizes,
      stockPool: Math.max(0, Math.floor(Number(form.stock) || 0)),
    }),
    [form.name, form.variant, form.sku, form.sizes, form.stock, current?.name],
  );

  const smartHints = useMemo(
    () =>
      buildSmartCrmHints({
        name: form.name,
        category: form.category,
        variant: form.variant,
        price: form.price,
        stock: form.stock,
        description: form.description,
        hasRealImage,
        publishStatus: current?.publishStatus ?? "unsaved",
      }),
    [form, hasRealImage, current?.publishStatus],
  );

  function applySmartDescription() {
    setFormError("");
    setFormSuccess(null);
    const draft = buildSmartDescriptionDraft(form.name, form.category, form.variant);
    patch({ description: draft });
    showFormSuccess("Smart Description · texte ajouté à la fiche boutique.", "neutral");
    setEditorTab("story");
  }

  function applySmartPaste() {
    setFormError("");
    setFormSuccess(null);
    const parsed = parseSmartProductText(smartPasteText, form.category);
    if (parsed.filled.length === 0) {
      showFormSuccess(buildSmartParseRecap(parsed), "neutral");
      return;
    }
    const filledSet = new Set<SmartParseFieldId>(parsed.filled);
    setForm((prev) => {
      const targetCategory = parsed.detectedCategory ?? prev.category;
      let next: FormState =
        parsed.detectedCategory !== undefined && parsed.detectedCategory !== prev.category
          ? {
              ...prev,
              category: parsed.detectedCategory,
              sizes: [],
              ...(editingId ? {} : { variant: "", colorDeclinations: [] }),
            }
          : { ...prev, category: targetCategory };

      next.name = filledSet.has("name") && parsed.name !== undefined ? parsed.name : "";
      next.description =
        filledSet.has("description") && parsed.description !== undefined ? parsed.description : "";
      next.materials =
        filledSet.has("materials") && parsed.materials !== undefined ? parsed.materials : "";
      next.fabrication =
        filledSet.has("fabrication") && parsed.fabrication !== undefined ? parsed.fabrication : "";
      next.limitedEdition =
        filledSet.has("limitedEdition") && parsed.limitedEdition !== undefined
          ? parsed.limitedEdition
          : "";
      next.printPlacement =
        filledSet.has("printPlacement") && parsed.printPlacement !== undefined
          ? parsed.printPlacement
          : "";
      next.price = filledSet.has("price") && parsed.price !== undefined ? parsed.price : "";

      const defaultStock = String(DEFAULT_SHOP_PRODUCT_STOCK);
      const pantsNow = isPantsCategory(targetCategory);
      if (pantsNow) {
        if (filledSet.has("sizes") && parsed.sizes !== undefined && parsed.sizes.length > 0) {
          next.sizes = parsed.sizes;
          next.stock = String(Math.min(parsed.sizes.length, 9999));
          next.variant = parsed.sizes.includes(next.variant)
            ? next.variant
            : (parsed.sizes[0] ?? "");
        } else {
          next.sizes = [];
          next.variant = "";
          next.stock = defaultStock;
        }
        next.colorDeclinations = [];
      } else {
        if (filledSet.has("variant") && parsed.variantColor !== undefined) {
          next.variant = parsed.variantColor;
          next.colorDeclinations = [parsed.variantColor];
        } else {
          next.variant = "";
          next.colorDeclinations = [];
        }
        if (filledSet.has("sizes") && parsed.sizes !== undefined && parsed.sizes.length > 0) {
          next.sizes = parsed.sizes;
          next.stock = String(Math.min(parsed.sizes.length, 9999));
        } else {
          next.sizes = [];
          next.stock = defaultStock;
        }
      }

      return next;
    });
    const appliedCategory = parsed.detectedCategory ?? form.category;
    const pantsApplied = isPantsCategory(appliedCategory);
    if (filledSet.has("sizes") && parsed.sizes !== undefined && parsed.sizes.length > 0 && pantsApplied) {
      setWaistListDraft(parsed.sizes.join(", "));
    } else {
      setWaistListDraft(pantsApplied ? "" : waistDeclinationsLabel([], ""));
    }
    if (filledSet.has("variant") && parsed.variantColor !== undefined && !pantsApplied) {
      setColorListDraft(colorDeclinationsLabel([parsed.variantColor]));
    } else {
      setColorListDraft("");
    }
    showSmartPasteSuccess(parsed);
  }

  const publishStatus = current?.publishStatus ?? "draft";
  const isPublished = publishStatus === "live";

  /** Toute saisie ou média modifié = dirty (feedback immédiat, sans bloquer l’API). */
  const isDirty = useMemo(() => {
    if (imageRectoFile || imageVersoFile || imageRectoCleared || imageVersoCleared) return true;
    return !formStateMatchesBaseline(form, current);
  }, [form, current, imageRectoFile, imageVersoFile, imageRectoCleared, imageVersoCleared]);

  const draftSaveButtonClass = isPublished
    ? "h-12 flex-1 border-2 border-amber-500/90 bg-amber-950/40 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100 transition duration-200 hover:border-amber-400 disabled:opacity-50"
    : "h-12 flex-1 border border-zinc-600 bg-transparent text-[11px] font-bold uppercase tracking-[0.18em] text-white/85 transition duration-200 hover:border-zinc-400 hover:text-white disabled:opacity-50";

  const liveSaveButtonClass = isPublished
    ? "group h-12 flex-[1.2] bg-emerald-600 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_24px_rgba(5,150,105,0.42)] transition duration-200 hover:bg-emerald-500 disabled:opacity-50"
    : "group h-12 flex-[1.2] bg-[#0066FF] text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_24px_rgba(0,102,255,0.45)] transition duration-200 hover:bg-[#0052cc] disabled:opacity-50";

  const dirtyOutlineClass = isDirty ? "ring-1 ring-amber-400/50 ring-inset" : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/85 p-3 pb-8 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={editingId ? "Modifier le produit" : "Nouveau produit"}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain border border-zinc-800 bg-[#090909] shadow-2xl lg:max-h-[calc(100dvh-2rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
          className="flex min-h-0 flex-col p-5 pb-6 sm:p-6 lg:flex-row lg:gap-6"
        >
          <aside className="mb-4 flex gap-1 border-b border-zinc-800 pb-4 lg:mb-0 lg:w-44 lg:shrink-0 lg:flex-col lg:gap-2 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
            <button
              type="button"
              onClick={() => setEditorTab("product")}
              className={`px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.2em] transition ${
                editorTab === "product"
                  ? "bg-white text-black"
                  : "border border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              Produit
            </button>
            <button
              type="button"
              onClick={() => setEditorTab("story")}
              className={`px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.2em] transition ${
                editorTab === "story"
                  ? "bg-white text-black"
                  : "border border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              Fiche boutique
            </button>
          </aside>
          <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-xs uppercase tracking-[0.28em] text-white/80">
                {editingId ? "Modifier le produit" : "Nouveau produit"}
              </h2>
              <p className="mt-1 text-[10px] tracking-[0.06em] text-zinc-500">Smart CRM · saisie & aperçu live</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-zinc-700 text-lg leading-none text-zinc-400 transition hover:border-zinc-500 hover:text-white disabled:opacity-40"
            >
              ×
            </button>
          </div>

          {formError ? <p className="mt-3 text-sm text-red-400">{formError}</p> : null}
          {formSuccess ? (
            formSuccess.kind === "smart-parse" ? (
              <div
                role="status"
                className="mt-3 rounded-sm border border-zinc-600 bg-zinc-900/55 px-3 py-2.5 text-sm text-white/75 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {formSuccess.title}
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] leading-snug text-white/85">
                  {formSuccess.blocks.map((b, idx) => (
                    <li key={`${b.key}-${idx}`}>
                      <span className="font-medium text-zinc-300">{b.label}</span>
                      {" · "}
                      <span className="text-white/80">{b.value}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 border-t border-zinc-700/80 pt-2 text-[11px] leading-relaxed text-zinc-500">
                  {formSuccess.analysisLine}
                </p>
                <p className="mt-1 text-[12px] text-zinc-400">{formSuccess.filledSummary}</p>
              </div>
            ) : (
              <p
                className={`mt-3 rounded-sm border px-3 py-2 text-sm ${
                  formSuccess.tone === "live"
                    ? "border-emerald-500/40 bg-emerald-950/35 text-emerald-200"
                    : formSuccess.tone === "draft"
                      ? "border-yellow-500/45 bg-yellow-950/35 text-yellow-100"
                      : "border-zinc-700 bg-zinc-900/50 text-white/70"
                }`}
              >
                {formSuccess.message}
              </p>
            )
          ) : null}

          <div className="mt-5 grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="min-w-0 space-y-4">
              {editorTab === "product" ? (
                <>
                  <label className="block text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    Catégorie
                    <select
                      value={form.category}
                      onChange={(event) => changeCategory(event.target.value as ProductCategory)}
                      className="mt-2 h-11 w-full appearance-none rounded-sm border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition duration-200 focus:border-zinc-400"
                    >
                      {PRODUCT_CATEGORIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <label className="block flex-1 min-w-[12rem] text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        Nom / Titre
                        <input
                          value={form.name}
                          onChange={(event) => patch({ name: event.target.value })}
                          required
                          className="mt-2 h-11 w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition duration-200 focus:border-zinc-400"
                        />
                      </label>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSmartPasteOpen((open) => !open)}
                          aria-expanded={smartPasteOpen}
                          className={`h-11 border px-3 text-[10px] uppercase tracking-[0.14em] transition duration-200 ${
                            smartPasteOpen
                              ? "border-cyan-400/50 bg-cyan-950/50 text-cyan-100"
                              : "border-cyan-500/35 bg-cyan-950/30 text-cyan-100/90 hover:border-cyan-400/45 hover:bg-cyan-900/40"
                          }`}
                        >
                          Smart collage
                        </button>
                        <button
                          type="button"
                          onClick={applySmartDescription}
                          className="h-11 border border-violet-500/40 bg-violet-950/40 px-3 text-[10px] uppercase tracking-[0.14em] text-violet-100 transition duration-200 hover:border-violet-400/60 hover:bg-violet-900/50"
                        >
                          ✨ Smart Description
                        </button>
                      </div>
                    </div>
                    {smartPasteOpen ? (
                      <div className="mt-3 space-y-3 rounded-sm border border-cyan-500/25 bg-cyan-950/15 p-3 sm:p-4">
                        <label
                          htmlFor="dingry-smart-paste"
                          className="block text-[10px] uppercase tracking-[0.18em] text-zinc-500"
                        >
                          Coller une fiche produit brute
                          <textarea
                            id="dingry-smart-paste"
                            value={smartPasteText}
                            onChange={(event) => setSmartPasteText(event.target.value)}
                            rows={8}
                            placeholder="Titre en première ligne, puis description, matière (ex. 70 % coton…), prix (80 €), tailles (S M L XL)…"
                            className="mt-2 w-full resize-y rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-relaxed text-white placeholder:text-zinc-600 outline-none transition duration-200 focus:border-cyan-500/40"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={applySmartPaste}
                          disabled={saving || convertingImage}
                          className="h-10 w-full border border-cyan-500/50 bg-cyan-950/40 text-[10px] uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-400 hover:bg-cyan-900/50 disabled:opacity-40 sm:w-auto sm:px-5"
                        >
                          Appliquer au formulaire
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      {pantsForm ? "Tours de taille" : "Variante / couleur"}
                    </p>
                    <AdminVariantSwatches
                      category={form.category}
                      value={form.variant}
                      selected={pantsForm ? form.sizes : form.colorDeclinations}
                      multiple
                      onChange={(variant) => patch({ variant })}
                      onToggle={pantsForm ? toggleSize : toggleColorDeclination}
                    />
                    <input
                      value={pantsForm ? waistListDraft : colorListDraft}
                      onChange={(event) => {
                        if (pantsForm) onWaistListDraftChange(event.target.value);
                        else onColorListDraftChange(event.target.value);
                      }}
                      placeholder={
                        pantsForm
                          ? `Tours · 28, 30, 32 (${PANT_WAIST_MIN}–${PANT_WAIST_MAX})`
                          : "Couleurs · NOIR, ROUGE, VERT"
                      }
                      className="mt-3 h-11 w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition duration-200 focus:border-zinc-400"
                    />
                    {!pantsForm ? (
                      <div className="mt-4 border-t border-zinc-800 pt-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                          Déclinaisons couleur (boutique)
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed tracking-[0.04em] text-zinc-600">
                          Coche les coloris affichés dans le modal. Une fiche par coloris en stock · les autres
                          restent « bientôt ».
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ADMIN_VARIANT_PRESETS[form.category].map((preset) => {
                            const active = form.colorDeclinations.some(
                              (item) => item.trim().toUpperCase() === preset.toUpperCase(),
                            );
                            return (
                              <button
                                key={`decl-${preset}`}
                                type="button"
                                onClick={() => toggleColorDeclination(preset)}
                                className={`border px-2.5 py-1.5 text-[9px] uppercase tracking-[0.12em] transition ${
                                  active
                                    ? "border-orange-400/70 bg-orange-950/40 text-orange-100"
                                    : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                {preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <label className="block text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    Impression / finition
                    <select
                      value={form.printPlacement}
                      onChange={(event) =>
                        patch({ printPlacement: event.target.value as ProductPrintPlacement })
                      }
                      className="mt-2 h-11 w-full appearance-none rounded-sm border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition duration-200 focus:border-zinc-400"
                    >
                      {PRODUCT_PRINT_PLACEMENT_OPTIONS.map((opt) => (
                        <option key={opt || "unset"} value={opt}>
                          {PRODUCT_PRINT_PLACEMENT_LABELS[opt]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      Prix (€)
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={form.price}
                        onChange={(event) => patch({ price: event.target.value })}
                        required
                        className="mt-2 h-11 w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 text-sm tabular-nums text-white outline-none transition duration-200 focus:border-zinc-400"
                      />
                    </label>
                    <label className="block text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        Stock global
                        <span
                          title="Quantité partagée entre toutes les tailles actives. Gérer par taille : ajuste les tailles cochées ci-dessous."
                          className="cursor-help rounded-full border border-zinc-600 px-1.5 text-[9px] normal-case tracking-normal text-zinc-400"
                        >
                          i
                        </span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={9999}
                        step={1}
                        value={form.stock}
                        onChange={(event) => patch({ stock: event.target.value })}
                        required
                        className="mt-2 h-11 w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 text-sm tabular-nums text-white outline-none transition duration-200 focus:border-zinc-400"
                      />
                      <span className="mt-1 block text-[9px] normal-case tracking-normal text-zinc-600">
                        Gérer par taille · une réserve pour l’ensemble des tailles sélectionnées
                      </span>
                    </label>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      {pantsForm ? "Tours en stock" : "Tailles"}
                    </p>
                    <div className="mt-2 grid grid-cols-5 gap-2 sm:max-w-md">
                      {ADMIN_CATEGORY_SIZES[form.category].map((size) => {
                        const active = form.sizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`h-10 text-xs font-medium tracking-[0.12em] transition duration-200 ${
                              active
                                ? "bg-white text-black shadow-[0_0_14px_rgba(255,255,255,0.2)]"
                                : "border border-zinc-700 bg-zinc-950 text-zinc-500 hover:border-zinc-500 hover:text-white"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                      {extraPantWaists.map((size) => (
                        <button
                          key={`custom-${size}`}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`h-10 text-xs tracking-[0.12em] transition duration-200 ${
                            form.sizes.includes(size)
                              ? "bg-white text-black"
                              : "border border-zinc-700 text-zinc-500"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {pantsForm ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={customPantWaist}
                          onChange={(event) =>
                            setCustomPantWaist(event.target.value.replace(/\D/g, "").slice(0, 2))
                          }
                          placeholder="Perso."
                          className="h-9 w-16 rounded-sm border border-zinc-700 bg-zinc-950 px-2 text-center text-sm text-white outline-none focus:border-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={addCustomPantWaist}
                          className="h-9 border border-zinc-600 px-3 text-[10px] uppercase tracking-[0.16em] text-zinc-300 hover:border-zinc-400"
                        >
                          Ajouter tour
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Média produit</p>
                    <div className="mt-2 grid gap-4 sm:grid-cols-2">
                      <AdminMediaDropzone
                        label="1 · Photo recto (face)"
                        previewSrc={previewRectoSrc}
                        converting={convertingRecto}
                        onFile={(file) => void acceptImageRecto(file)}
                      />
                      <AdminMediaDropzone
                        label="2 · Photo verso (dos)"
                        previewSrc={previewVersoSrc}
                        converting={convertingVerso}
                        onFile={(file) => void acceptImageVerso(file)}
                      />
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                      WebP · jusqu’à 10 Mo par face · conversion automatique
                    </p>
                  </div>

                  {current ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setPrintSheetOpen(true)}
                        className="h-11 flex-1 border border-zinc-600 text-[11px] uppercase tracking-[0.2em] text-zinc-200 transition hover:border-zinc-400"
                      >
                        Imprimer
                      </button>
                      <button
                        type="button"
                        disabled={busyProductId === current.id}
                        onClick={() => void handleDelete()}
                        className="h-11 flex-1 border border-red-500/35 text-[11px] uppercase tracking-[0.2em] text-red-400 transition hover:border-red-400/60 disabled:opacity-40"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] leading-relaxed tracking-[0.06em] text-zinc-500">
                    Textes du modal client — champs vides = défauts boutique.
                  </p>
                  {(
                    [
                      ["Description", "description", 3],
                      ["Fabrication", "fabrication", 2],
                      ["Édition limitée", "limitedEdition", 2],
                      ["Matières", "materials", 2],
                      ["Guide des tailles", "sizeGuide", 2],
                    ] as const
                  ).map(([label, key, rows]) => (
                    <label key={key} className="block text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {label}
                      <textarea
                        rows={rows}
                        value={form[key]}
                        onChange={(event) => patch({ [key]: event.target.value })}
                        className="mt-2 w-full resize-y rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-relaxed text-white outline-none transition duration-200 focus:border-zinc-400"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-4 lg:self-start">
              <AdminProductPreview model={previewModel} className="mx-auto w-full max-w-sm lg:max-w-md" />
            </div>
          </div>

          <AdminSmartCrmBanner hints={smartHints} />

          <div className="sticky bottom-0 z-10 mt-6 border-t border-zinc-800 bg-[#090909]/95 py-4 backdrop-blur-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-12 flex-1 border border-transparent text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 transition hover:text-white disabled:opacity-50 sm:max-w-[140px]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving || convertingImage}
                onClick={() =>
                  void (editorTab === "product" ? saveProductTab("draft") : saveStoryTab("draft"))
                }
                title={
                  isPublished
                    ? "Attention · le produit repasse en brouillon (invisible boutique)."
                    : "Enregistrer sans publier sur la boutique."
                }
                className={`${draftSaveButtonClass} ${dirtyOutlineClass}`}
              >
                {saving ? "Enregistrement…" : "Enregistrer brouillon"}
              </button>
              <button
                type="button"
                disabled={saving || convertingImage}
                onClick={() =>
                  void (editorTab === "product" ? saveProductTab("live") : saveStoryTab("live"))
                }
                title={
                  isPublished
                    ? "Produit déjà visible · enregistre et maintient en ligne."
                    : "Attention · visible immédiatement sur la boutique (image requise)."
                }
                className={`${liveSaveButtonClass} ${dirtyOutlineClass}`}
              >
                {saving ? (
                  "Enregistrement…"
                ) : isPublished ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    En ligne ✓
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    Mettre en ligne
                    <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[9px] uppercase tracking-[0.12em] text-zinc-500">
              {isPublished ? (
                <>
                  <span className="text-amber-400/90">Brouillon</span> = retire de la boutique ·{" "}
                  <span className="text-zinc-400">En ligne</span> = déjà publié
                </>
              ) : (
                <>
                  <span className="text-zinc-400">Brouillon</span> = admin seulement ·{" "}
                  <span className="text-zinc-400">En ligne</span> = visible boutique
                </>
              )}
            </p>
            {isDirty ? (
              <p
                className="mt-1.5 text-center text-[9px] uppercase tracking-[0.14em] text-amber-400/85"
                aria-live="polite"
              >
                Modifications non enregistrées
              </p>
            ) : null}
          </div>
          </div>
        </form>
      </motion.div>
      <PrintSizePickerSheet
        open={printSheetOpen}
        product={printPickerProduct}
        onClose={() => setPrintSheetOpen(false)}
      />
    </motion.div>
  );
}
