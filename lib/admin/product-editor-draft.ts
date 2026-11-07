import type { ProductCategory, ProductSize } from "@/lib/admin/types";
import type { ProductStoryFormFields } from "@/lib/admin/product-story";

const DRAFT_VERSION = 1 as const;
const STORAGE_PREFIX = "dingry:crm:product-draft:";

export type ProductEditorDraftForm = {
  sku: string;
  name: string;
  variant: string;
  colorDeclinations: string[];
  category: ProductCategory;
  price: string;
  stock: string;
  sizes: ProductSize[];
} & ProductStoryFormFields;

export type ProductEditorDraft = {
  v: typeof DRAFT_VERSION;
  form: ProductEditorDraftForm;
  colorListDraft: string;
  waistListDraft: string;
  editorTab: "product" | "story";
  smartPasteOpen: boolean;
  smartPasteText: string;
  imageRectoCleared: boolean;
  imageVersoCleared: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isDraftForm(value: unknown): value is ProductEditorDraftForm {
  if (!isRecord(value)) return false;
  return (
    typeof value.sku === "string" &&
    typeof value.name === "string" &&
    typeof value.variant === "string" &&
    Array.isArray(value.colorDeclinations) &&
    typeof value.category === "string" &&
    typeof value.price === "string" &&
    typeof value.stock === "string" &&
    Array.isArray(value.sizes) &&
    typeof value.description === "string" &&
    typeof value.limitedEdition === "string" &&
    typeof value.printPlacement === "string"
  );
}

export function productEditorDraftKey(sessionId: string): string {
  return `${STORAGE_PREFIX}${sessionId}`;
}

export function readProductEditorDraft(sessionId: string): ProductEditorDraft | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(productEditorDraftKey(sessionId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.v !== DRAFT_VERSION) return null;
    if (!isDraftForm(parsed.form)) return null;
    return {
      v: DRAFT_VERSION,
      form: parsed.form,
      colorListDraft: typeof parsed.colorListDraft === "string" ? parsed.colorListDraft : "",
      waistListDraft: typeof parsed.waistListDraft === "string" ? parsed.waistListDraft : "",
      editorTab: parsed.editorTab === "story" ? "story" : "product",
      smartPasteOpen: parsed.smartPasteOpen !== false,
      smartPasteText: typeof parsed.smartPasteText === "string" ? parsed.smartPasteText : "",
      imageRectoCleared: parsed.imageRectoCleared === true,
      imageVersoCleared: parsed.imageVersoCleared === true,
    };
  } catch {
    return null;
  }
}

export function writeProductEditorDraft(sessionId: string, draft: ProductEditorDraft): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(productEditorDraftKey(sessionId), JSON.stringify(draft));
  } catch {
    /* quota navigateur */
  }
}

export function clearProductEditorDraft(sessionId: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(productEditorDraftKey(sessionId));
  } catch {
    /* ignore */
  }
}
