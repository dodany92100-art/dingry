import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearProductEditorDraft,
  productEditorDraftKey,
  readProductEditorDraft,
  writeProductEditorDraft,
  type ProductEditorDraft,
} from "@/lib/admin/product-editor-draft";

const SESSION = "test-42";

function createSessionStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

const sampleDraft: ProductEditorDraft = {
  v: 1,
  form: {
    sku: "DGRY-TEE-01",
    name: "Tee test",
    variant: "NOIR",
    colorDeclinations: ["NOIR"],
    description: "",
    fabrication: "",
    limitedEdition: "",
    materials: "",
    sizeGuide: "",
    printPlacement: "",
    category: "T-shirts",
    price: "35",
    stock: "10",
    sizes: ["M"],
  },
  colorListDraft: "NOIR",
  waistListDraft: "",
  editorTab: "product",
  smartPasteOpen: true,
  smartPasteText: "",
  imageRectoCleared: false,
  imageVersoCleared: false,
};

describe("product-editor-draft", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", createSessionStorageMock());
  });

  afterEach(() => {
    clearProductEditorDraft(SESSION);
    vi.unstubAllGlobals();
  });

  it("round-trip sessionStorage", () => {
    writeProductEditorDraft(SESSION, sampleDraft);
    expect(sessionStorage.getItem(productEditorDraftKey(SESSION))).toBeTruthy();
    expect(readProductEditorDraft(SESSION)).toEqual(sampleDraft);
  });

  it("rejette un JSON invalide", () => {
    sessionStorage.setItem(productEditorDraftKey(SESSION), '{"v":2}');
    expect(readProductEditorDraft(SESSION)).toBeNull();
  });
});
