import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobPreconditionFailedError, del, get, put } from "@vercel/blob";
import { isBlobConfigured } from "@/lib/admin/blob-config";
import { adjustStock, readStockQuantity, seedCatalogStockFromProducts, seedStockIfMissing, writeStockQuantity } from "@/lib/stock";
import { createSeededStore, SEEDED_PRODUCTS } from "@/lib/admin/seed";
import { assertPublishableProduct, requirePublishableProduct } from "@/lib/admin/assert-publishable";
import { seededLookbookSlides } from "@/lib/admin/lookbook-seed";
import {
  isVersoCatalogId,
  resolveRectoCatalogId,
  VERSO_TO_RECTO_CATALOG_ID,
} from "@/lib/catalog-verso-recto";
import { CATALOG_CANONICAL_IMAGE_BY_ID, DINGRY_JERSEY_PRODUCT_IDS, DINGRY_SWEAT_PRODUCT_IDS, DINGRY_TEE_PRODUCT_IDS } from "@/lib/dingry-product-media";
import {
  DRAFT_PRODUCT_PLACEHOLDER_IMAGE,
  isDraftPlaceholderImage,
  isProductCategory,
  isProductSize,
  normalizeProductCategory,
  normalizePublishStatus,
  normalizePrintPlacement,
  STORE_VERSION,
  type AdminLookbookSlide,
  type AdminOrder,
  type AdminProduct,
  type AdminStore,
  parseColorDeclinations,
  type ProductCategory,
  type ProductPrintPlacement,
  type ProductPublishStatus,
  type ProductSize,
} from "@/lib/admin/types";
import type { DropBatchItem } from "@/lib/admin/drop-batch";
import {
  applyDisplayOrderByIds,
  normalizeDisplayOrder,
  normalizeIsPinned,
} from "@/lib/admin/product-display-order";

const STORE_PATHNAME = "dingry/admin/store.json";
const LOCAL_STORE_PATH = path.join(process.cwd(), "data", "admin", "store.json");
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "admin-uploads");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/webp"]);
const STORE_WRITE_ATTEMPTS = 5;

export class StoreConflictError extends Error {
  constructor() {
    super("store-conflict");
    this.name = "StoreConflictError";
  }
}

export class StoreUnavailableError extends Error {
  constructor(message = "Magasin indisponible.") {
    super(message);
    this.name = "StoreUnavailableError";
  }
}

export { PublishValidationError } from "@/lib/admin/assert-publishable";

export class ProductStockAdjustError extends Error {
  constructor(
    message: string,
    readonly code: "negative" | "unavailable" | "missing",
  ) {
    super(message);
    this.name = "ProductStockAdjustError";
  }
}

type StoreSnapshot = {
  store: AdminStore;
  etag: string | null;
  /** Store JSON on disk/blob had an older version before normalize. */
  migratedFromVersion?: number;
};

/** Seules les erreurs de concurrence optimiste déclenchent un retry. */
export function isStoreWriteConflict(error: unknown): boolean {
  return error instanceof BlobPreconditionFailedError || error instanceof StoreConflictError;
}

function storeWriteBackoff(attempt: number): Promise<void> {
  const ms = 50 + Math.random() * 100 + attempt * 25;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function revisionFromDiskText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function cloneStore(store: AdminStore): AdminStore {
  return {
    ...store,
    products: store.products.map((product) => ({ ...product, sizes: [...product.sizes] })),
    orders: store.orders.map((order) => ({ ...order })),
    lookbook: store.lookbook.map((slide) => ({ ...slide })),
  };
}

function assertStoreBackend(): void {
  if (process.env.NODE_ENV === "production" && !isBlobConfigured()) {
    throw new StoreUnavailableError("BLOB_READ_WRITE_TOKEN requis en production.");
  }
}

/** En local le token Blob lit mais l'API d'écriture répond 403. Le fichier local fait foi. */
function useLocalStoreFiles(): boolean {
  return process.env.NODE_ENV !== "production";
}

async function readBlobSnapshot(): Promise<StoreSnapshot | "missing"> {
  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(STORE_PATHNAME, { access: "public" });
  } catch (error) {
    console.error("[store] lecture Blob", error instanceof Error ? error.name : "erreur");
    throw new StoreUnavailableError();
  }

  if (!result) {
    return "missing";
  }
  const statusCode = (result as { statusCode?: number }).statusCode;
  if (statusCode === 404) {
    return "missing";
  }
  if (result.statusCode !== 200 || !result.stream) {
    console.error("[store] Blob HTTP", result.statusCode ?? "sans réponse");
    throw new StoreUnavailableError();
  }

  let text: string;
  try {
    text = await new Response(result.stream).text();
  } catch (error) {
    console.error("[store] stream Blob", error instanceof Error ? error.name : "erreur");
    throw new StoreUnavailableError();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("[store] JSON blob invalide");
    throw new StoreUnavailableError();
  }
  if (!isAdminStore(parsed)) {
    console.error("[store] schéma blob invalide");
    throw new StoreUnavailableError();
  }
  const rawVersion = typeof (parsed as AdminStore).version === "number" ? (parsed as AdminStore).version : 0;
  const normalized = normalizeStore(parsed);
  return {
    store: normalized,
    etag: result.blob.etag,
    ...(rawVersion < STORE_VERSION ? { migratedFromVersion: rawVersion } : {}),
  };
}

async function readLocalSnapshot(): Promise<StoreSnapshot | "missing"> {
  try {
    const text = await readFile(LOCAL_STORE_PATH, "utf8");
    const parsed: unknown = JSON.parse(text);
    if (!isAdminStore(parsed)) {
      throw new StoreUnavailableError();
    }
    const rawVersion = typeof (parsed as AdminStore).version === "number" ? (parsed as AdminStore).version : 0;
    const normalized = normalizeStore(parsed);
    return {
      store: normalized,
      etag: revisionFromDiskText(text),
      ...(rawVersion < STORE_VERSION ? { migratedFromVersion: rawVersion } : {}),
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ENOENT") return "missing";
    if (error instanceof StoreUnavailableError) throw error;
    throw new StoreUnavailableError();
  }
}

async function readStoreSnapshot(): Promise<StoreSnapshot | "missing"> {
  assertStoreBackend();

  if (useLocalStoreFiles()) {
    const local = await readLocalSnapshot();
    if (local !== "missing") return local;
    if (isBlobConfigured()) {
      const remote = await readBlobSnapshot();
      if (remote !== "missing") {
        await writeLocalSnapshot(remote.store);
        return readLocalSnapshot();
      }
    }
    return "missing";
  }

  if (isBlobConfigured()) return readBlobSnapshot();
  throw new StoreUnavailableError();
}

async function writeLocalSnapshot(store: AdminStore): Promise<void> {
  const next: AdminStore = { ...store, version: STORE_VERSION };
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(next, null, 2), "utf8");
}

async function writeStoreSnapshot(store: AdminStore, etag: string | null): Promise<void> {
  assertStoreBackend();
  const next: AdminStore = { ...store, version: STORE_VERSION };
  const body = JSON.stringify(next);

  if (useLocalStoreFiles()) {
    if (etag) {
      try {
        const current = await readFile(LOCAL_STORE_PATH, "utf8");
        if (revisionFromDiskText(current) !== etag) {
          throw new StoreConflictError();
        }
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "ENOENT") throw new StoreConflictError();
        if (error instanceof StoreConflictError) throw error;
        throw error;
      }
    }
    await writeLocalSnapshot(next);
    return;
  }

  if (!isBlobConfigured()) {
    throw new StoreUnavailableError();
  }

  await put(STORE_PATHNAME, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: etag !== null,
    contentType: "application/json",
    cacheControlMaxAge: 0,
    ...(etag ? { ifMatch: etag } : {}),
  });
  return;
}

async function withStoreOptimistic<T>(
  mutate: (store: AdminStore) => { store: AdminStore; result: T; skipWrite?: boolean },
): Promise<T> {
  for (let attempt = 0; attempt < STORE_WRITE_ATTEMPTS; attempt++) {
    let snapshot = await readStoreSnapshot();
    if (snapshot === "missing") {
      snapshot = {
        store: normalizeStore(createSeededStore()),
        etag: null,
      };
    }

    const working = cloneStore(snapshot.store);
    const outcome = mutate(working);
    if (outcome.skipWrite) return outcome.result;

    try {
      await writeStoreSnapshot(outcome.store, snapshot.etag);
      return outcome.result;
    } catch (error) {
      if (!isStoreWriteConflict(error)) throw error;
      await storeWriteBackoff(attempt);
    }
  }

  throw new StoreConflictError();
}

function isAdminStore(value: unknown): value is AdminStore {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.products) && Array.isArray(record.orders);
}

function normalizeProduct(value: unknown): AdminProduct | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = String(record.id ?? "").trim();
  const name = String(record.name ?? "").trim();
  const price = Number(record.price);
  const imageUrlRaw = String(record.imageUrl ?? "").trim();
  const publishStatus = normalizePublishStatus(record.publishStatus);
  const imageUrl =
    imageUrlRaw ||
    (publishStatus === "draft" ? DRAFT_PRODUCT_PLACEHOLDER_IMAGE : "");
  if (!id || !name || !imageUrl || !Number.isFinite(price) || price <= 0) return null;

  const sizes = Array.isArray(record.sizes)
    ? record.sizes.filter((item): item is ProductSize => typeof item === "string" && isProductSize(item))
    : (["S", "M", "L", "XL"] as ProductSize[]);

  const categoryValue = String(record.category ?? "T-shirts");
  const category = normalizeProductCategory(categoryValue);

  return {
    id,
    sku: String(record.sku ?? `DINGRY-${id}`).trim() || `DINGRY-${id}`,
    name,
    variant: String(record.variant ?? "").trim(),
    description: String(record.description ?? "").trim(),
    fabrication: String(record.fabrication ?? "").trim(),
    limitedEdition: String(record.limitedEdition ?? "").trim(),
    materials: String(record.materials ?? "").trim(),
    sizeGuide: String(record.sizeGuide ?? "").trim(),
    printPlacement: normalizePrintPlacement(record.printPlacement),
    category,
    price,
    sizes: sizes.length > 0 ? sizes : [],
    stock: Math.max(0, Math.floor(Number(record.stock) || 0)),
    publishStatus,
    colorDeclinations: parseColorDeclinations(record.colorDeclinations),
    imageUrl,
    blobUrl: typeof record.blobUrl === "string" ? record.blobUrl : null,
    blobPathname: typeof record.blobPathname === "string" ? record.blobPathname : null,
    imageBackUrl: typeof record.imageBackUrl === "string" ? String(record.imageBackUrl).trim() : "",
    imageBackBlobUrl: typeof record.imageBackBlobUrl === "string" ? record.imageBackBlobUrl : null,
    imageBackBlobPathname:
      typeof record.imageBackBlobPathname === "string" ? record.imageBackBlobPathname : null,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    isPinned: normalizeIsPinned(record.isPinned),
    displayOrder: normalizeDisplayOrder(record.displayOrder),
  };
}

function ensureProductDisplayFields(product: AdminProduct): AdminProduct {
  return {
    ...product,
    isPinned: product.isPinned === true,
    displayOrder: normalizeDisplayOrder(product.displayOrder),
  };
}

function mergeSeedProduct(seed: AdminProduct, current: AdminProduct | undefined): AdminProduct {
  const seedIdNum = Number(seed.id);
  const canonicalImage = CATALOG_CANONICAL_IMAGE_BY_ID[seedIdNum];
  const catalogLocked =
    DINGRY_SWEAT_PRODUCT_IDS.has(seedIdNum) ||
    DINGRY_TEE_PRODUCT_IDS.has(seedIdNum) ||
    DINGRY_JERSEY_PRODUCT_IDS.has(seedIdNum) ||
    canonicalImage !== undefined;
  if (!current) return { ...seed, sizes: [...seed.sizes] };
  const genericSku = !current.sku || current.sku === `DINGRY-${current.id}`;
  const genericCategory =
    normalizeProductCategory(current.category) === "T-shirts" &&
    normalizeProductCategory(seed.category) !== "T-shirts";
  if (catalogLocked) {
    return {
      ...seed,
      ...current,
      imageUrl:
        canonicalImage ??
        (DINGRY_JERSEY_PRODUCT_IDS.has(seedIdNum) && current.imageUrl ? current.imageUrl : seed.imageUrl),
      category: DINGRY_SWEAT_PRODUCT_IDS.has(seedIdNum)
        ? "Crewnecks"
        : DINGRY_TEE_PRODUCT_IDS.has(seedIdNum)
          ? "T-shirts"
          : DINGRY_JERSEY_PRODUCT_IDS.has(seedIdNum)
            ? "Jerseys"
            : genericCategory
              ? normalizeProductCategory(seed.category)
              : normalizeProductCategory(current.category),
      name: current.name.includes(" — ") ? seed.name : current.name,
      variant: current.variant.trim() || seed.variant,
      description: current.description.trim() || seed.description,
      printPlacement: current.printPlacement || seed.printPlacement,
      sku: genericSku ? seed.sku : current.sku,
      sizes: current.sizes.length > 0 ? current.sizes : [...seed.sizes],
      price: current.price,
      stock: current.stock,
    };
  }
  return {
    ...seed,
    ...current,
    imageUrl: canonicalImage ?? current.imageUrl,
    sku: genericSku ? seed.sku : current.sku,
    variant: current.variant || seed.variant,
    description: current.description || seed.description,
    printPlacement: current.printPlacement || seed.printPlacement,
    category: genericCategory ? seed.category : current.category,
    name: current.name.includes(" — ") ? seed.name : current.name,
    sizes: current.sizes.length > 0 ? current.sizes : [...seed.sizes],
  };
}

function normalizeLookbookSlide(value: unknown): AdminLookbookSlide | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = String(record.id ?? "").trim();
  const title = String(record.title ?? "").trim();
  const imageUrl = String(record.imageUrl ?? "").trim();
  const sortOrder = Number(record.sortOrder);
  if (!id || !title || !imageUrl || !Number.isInteger(sortOrder) || sortOrder < 0) return null;
  return {
    id,
    title,
    caption: String(record.caption ?? "").trim(),
    imageUrl,
    blobUrl: typeof record.blobUrl === "string" ? record.blobUrl : null,
    blobPathname: typeof record.blobPathname === "string" ? record.blobPathname : null,
    sortOrder,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
  };
}

function mergeLookbookSlides(raw: AdminStore): AdminLookbookSlide[] {
  const seeded = seededLookbookSlides();
  const existing = (Array.isArray(raw.lookbook) ? raw.lookbook : [])
    .map(normalizeLookbookSlide)
    .filter((item): item is AdminLookbookSlide => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (existing.length === 0) return seeded;
  return existing;
}

/** v12 : une fiche recto peut porter recto + verso ; les anciennes fiches « — VERSO » alimentent `imageBackUrl`. */
function migrateProductVersoBackUrl(products: AdminProduct[]): AdminProduct[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const versoImageByRectoId = new Map<string, string>();
  for (const p of products) {
    if (!/\bVERSO\b/i.test(p.variant)) continue;
    const rectoId = String(resolveRectoCatalogId(Number(p.id)));
    const recto = byId.get(rectoId);
    if (!recto) continue;
    if (recto.imageBackUrl.trim()) continue;
    const src = p.imageUrl.trim();
    if (!src || isDraftPlaceholderImage(src)) continue;
    versoImageByRectoId.set(rectoId, src);
  }

  return products.map((p) => {
    const backFromPair = versoImageByRectoId.get(p.id);
    if (backFromPair && !p.imageBackUrl.trim()) {
      return { ...p, imageBackUrl: backFromPair };
    }
    return p;
  });
}

function migrateStore(raw: AdminStore): AdminStore {
  let source = raw;
  if (raw.version < 6) {
    const seedById = new Map(SEEDED_PRODUCTS.map((seed) => [seed.id, seed]));
    source = {
      ...raw,
      products: raw.products.map((item) => {
        const seed = seedById.get(String(item.id));
        return seed ? { ...item, price: seed.price } : item;
      }),
    };
  }

  const existing = source.products
    .map(normalizeProduct)
    .filter((item): item is AdminProduct => item !== null);
  const byId = new Map(existing.map((item) => [item.id, item]));
  const removed = new Set(
    (Array.isArray(raw.removedCatalogIds) ? raw.removedCatalogIds : [])
      .map((id) => String(id).trim())
      .filter(Boolean),
  );

  const activeSeeds = SEEDED_PRODUCTS.filter((seed) => !removed.has(seed.id));

  const finalizeProducts = (items: AdminProduct[]) =>
    items.map(ensureProductDisplayFields);

  if (raw.version === STORE_VERSION && existing.length > 0) {
    const mergedSeed = activeSeeds.map((seed) => mergeSeedProduct(seed, byId.get(seed.id)));
    const extras = existing.filter(
      (item) => !SEEDED_PRODUCTS.some((seed) => seed.id === item.id) && !removed.has(item.id),
    );
    const products = migrateProductVersoBackUrl([...mergedSeed, ...extras]);
    return {
      version: STORE_VERSION,
      products: finalizeProducts(products),
      orders: raw.orders,
      lookbook: mergeLookbookSlides(raw),
      removedCatalogIds: [...removed],
    };
  }

  const mergedSeed = activeSeeds.map((seed) => mergeSeedProduct(seed, byId.get(seed.id)));
  const extras = existing.filter(
    (item) => !SEEDED_PRODUCTS.some((seed) => seed.id === item.id) && !removed.has(item.id),
  );
  const products = migrateProductVersoBackUrl([...mergedSeed, ...extras]);

  return {
    version: STORE_VERSION,
    products: finalizeProducts(products),
    orders: raw.orders,
    lookbook: mergeLookbookSlides(raw),
    removedCatalogIds: [...removed],
  };
}

function normalizeStore(value: AdminStore): AdminStore {
  return migrateStore({
    version: typeof value.version === "number" ? value.version : 0,
    products: Array.isArray(value.products) ? value.products : [],
    orders: Array.isArray(value.orders) ? value.orders : [],
    lookbook: Array.isArray(value.lookbook) ? value.lookbook : [],
    removedCatalogIds: Array.isArray(value.removedCatalogIds) ? value.removedCatalogIds : [],
  });
}

/** Lecture seule : aucune écriture Blob (catalogue, devis, findOrder). */
export async function loadStoreReadOnly(): Promise<AdminStore> {
  try {
    const snapshot = await readStoreSnapshot();
    if (snapshot === "missing") {
      if (process.env.NODE_ENV === "production") {
        throw new StoreUnavailableError();
      }
      return normalizeStore(createSeededStore());
    }
    return snapshot.store;
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
      console.error("[store] lecture seule indisponible, catalogue seed");
      return normalizeStore(createSeededStore());
    }
    throw error;
  }
}

async function ensureInitialStore(): Promise<AdminStore> {
  const seeded = normalizeStore(createSeededStore());
  try {
    await writeStoreSnapshot(seeded, null);
    await seedCatalogStockFromProducts(seeded.products);
    return seeded;
  } catch (error) {
    if (isStoreWriteConflict(error)) {
      const again = await readStoreSnapshot();
      if (again !== "missing") return again.store;
    }
    throw error;
  }
}

/** Charge le magasin ; peut créer le fichier initial (admin, écritures). */
export async function loadStore(): Promise<AdminStore> {
  const snapshot = await readStoreSnapshot();
  if (snapshot === "missing") {
    return ensureInitialStore();
  }
  if (snapshot.migratedFromVersion !== undefined) {
    try {
      await writeStoreSnapshot(snapshot.store, snapshot.etag);
    } catch (error) {
      console.error("[store] persistance migration version", error instanceof Error ? error.name : "erreur");
    }
  }
  return snapshot.store;
}

function safeFileName(name: string): string {
  const base = name.trim() || "image";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "L'image doit être convertie en WebP avant l'enregistrement.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image trop lourde (10 Mo maximum après conversion).";
  }
  return null;
}

type ProductImageFace = "recto" | "verso";

export async function uploadProductImage(
  productId: string,
  file: File,
  face: ProductImageFace = "recto",
): Promise<{ imageUrl: string; blobUrl: string | null; blobPathname: string | null }> {
  const filename = `${safeFileName(file.name).replace(/\.[^.]+$/, "") || "image"}.webp`;
  const pathname = `dingry/products/${productId}/${face}-${filename}`;

  if (useLocalStoreFiles()) {
    await mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
    const localName = `${productId}-${Date.now()}-${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(LOCAL_UPLOADS_DIR, localName), bytes);
    return {
      imageUrl: `/admin-uploads/${localName}`,
      blobUrl: null,
      blobPathname: null,
    };
  }

  if (isBlobConfigured()) {
    try {
      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: "image/webp",
      });
      return {
        imageUrl: blob.url,
        blobUrl: blob.url,
        blobPathname: blob.pathname,
      };
    } catch (error) {
      console.error("[store] upload Blob produit", error instanceof Error ? error.name : "erreur");
      throw new StoreUnavailableError("Upload image impossible (Vercel Blob).");
    }
  }

  throw new StoreUnavailableError("Stockage image indisponible.");
}

async function deleteLocalUpload(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/admin-uploads/")) return;
  const relative = imageUrl.replace("/admin-uploads/", "");
  const filePath = path.join(LOCAL_UPLOADS_DIR, path.basename(relative));
  try {
    await unlink(filePath);
  } catch {
    // fichier déjà absent
  }
}

async function deleteBlobOrLocal(
  blobUrl: string | null,
  blobPathname: string | null,
  imageUrl: string,
): Promise<void> {
  if (blobUrl) {
    await del(blobUrl);
    return;
  }
  if (blobPathname) {
    await del(blobPathname);
    return;
  }
  await deleteLocalUpload(imageUrl);
}

/** Supprime le média recto ou verso sans toucher l’autre face. */
export async function deleteProductFaceMedia(
  product: AdminProduct,
  face: ProductImageFace,
): Promise<void> {
  if (face === "recto") {
    if (!product.imageUrl.trim() || isDraftPlaceholderImage(product.imageUrl)) return;
    await deleteBlobOrLocal(product.blobUrl, product.blobPathname, product.imageUrl);
    return;
  }
  const back = product.imageBackUrl.trim();
  if (!back) return;
  await deleteBlobOrLocal(product.imageBackBlobUrl, product.imageBackBlobPathname, back);
}

export async function deleteProductImage(product: AdminProduct): Promise<void> {
  await deleteProductFaceMedia(product, "recto");
  await deleteProductFaceMedia(product, "verso");
}

function nextProductId(products: AdminProduct[]): string {
  const max = products.reduce((current, item) => {
    const value = Number(item.id);
    return Number.isInteger(value) && value > current ? value : current;
  }, 24);
  return String(max + 1);
}

export type ProductInput = {
  sku: string;
  name: string;
  variant: string;
  description: string;
  fabrication: string;
  limitedEdition: string;
  materials: string;
  sizeGuide: string;
  printPlacement?: ProductPrintPlacement;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  stock: number;
  publishStatus: ProductPublishStatus;
  colorDeclinations?: string[];
  isPinned?: boolean;
  displayOrder?: number;
};

type ProductUpdateMedia = {
  rectoFile?: File;
  versoFile?: File;
  clearImage?: boolean;
  clearImageBack?: boolean;
};

export type PublishSelectionOutcome = {
  products: AdminProduct[];
  publishedIds: string[];
  skipped: { id: string; reason: string }[];
};

export async function publishAdminProductsToLive(
  productIds: readonly string[],
): Promise<PublishSelectionOutcome | null> {
  const unique = [...new Set(productIds.map((id) => String(id).trim()).filter(Boolean))];
  if (unique.length === 0) return null;

  return withStoreOptimistic((store) => {
    const publishedIds: string[] = [];
    const skipped: { id: string; reason: string }[] = [];

    for (const id of unique) {
      const product = store.products.find((item) => item.id === id);
      if (!product) {
        skipped.push({ id, reason: "Produit introuvable." });
        continue;
      }
      if (product.publishStatus === "live") {
        continue;
      }
      const verdict = assertPublishableProduct(product);
      if (!verdict.ok) {
        skipped.push({ id, reason: verdict.reason });
        continue;
      }
      product.publishStatus = "live";
      publishedIds.push(id);
    }

    if (publishedIds.length === 0) {
      return { store, result: { products: store.products, publishedIds, skipped }, skipWrite: true };
    }

    return { store, result: { products: store.products, publishedIds, skipped } };
  });
}

/** Ordre + publication drop : une seule écriture store (batch). */
export async function applyAdminDropBatch(
  items: readonly DropBatchItem[],
): Promise<PublishSelectionOutcome | null> {
  if (items.length === 0) return null;

  const knownIds = new Set<string>();
  for (const item of items) {
    const id = String(item.id).trim();
    if (!id || knownIds.has(id)) return null;
    knownIds.add(id);
    if (!Number.isFinite(item.displayOrder) || item.displayOrder < 0) return null;
  }

  return withStoreOptimistic((store) => {
    const storeIds = new Set(store.products.map((product) => product.id));
    if (items.length !== store.products.length) {
      return { store, result: null, skipWrite: true };
    }
    for (const item of items) {
      if (!storeIds.has(item.id)) return { store, result: null, skipWrite: true };
    }

    const orderedIds = [...items]
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id))
      .map((item) => item.id);

    store.products = applyDisplayOrderByIds(store.products, orderedIds);

    const publishedIds: string[] = [];
    const skipped: { id: string; reason: string }[] = [];

    for (const item of items) {
      if (item.status !== "published") continue;
      const product = store.products.find((row) => row.id === item.id);
      if (!product) continue;
      if (product.publishStatus === "live") continue;
      const verdict = assertPublishableProduct(product);
      if (!verdict.ok) {
        skipped.push({ id: item.id, reason: verdict.reason });
        continue;
      }
      product.publishStatus = "live";
      publishedIds.push(item.id);
    }

    const wantsPublish = items.some((item) => item.status === "published");
    if (wantsPublish && publishedIds.length === 0) {
      return {
        store,
        result: { products: store.products, publishedIds, skipped },
        skipWrite: true,
      };
    }

    return { store, result: { products: store.products, publishedIds, skipped } };
  });
}

export async function reorderAdminProductDisplay(
  orderedIds: readonly string[],
): Promise<AdminProduct[] | null> {
  if (orderedIds.length === 0) return null;
  const unique = new Set(orderedIds.map((id) => String(id).trim()).filter(Boolean));
  if (unique.size !== orderedIds.length) return null;

  return withStoreOptimistic((store) => {
    const known = new Set(store.products.map((item) => item.id));
    for (const id of orderedIds) {
      if (!known.has(id)) return { store, result: null, skipWrite: true };
    }
    store.products = applyDisplayOrderByIds(store.products, orderedIds);
    return { store, result: store.products };
  });
}

export async function createProduct(
  input: ProductInput & { file?: File | null; fileBack?: File | null },
): Promise<AdminProduct> {
  const snapshot = await readStoreSnapshot();
  const base = snapshot === "missing" ? normalizeStore(createSeededStore()) : snapshot.store;
  const id = nextProductId(base.products);
  let uploaded: Awaited<ReturnType<typeof uploadProductImage>>;
  if (input.file && input.file.size > 0) {
    uploaded = await uploadProductImage(id, input.file, "recto");
  } else if (input.publishStatus === "draft") {
    uploaded = {
      imageUrl: DRAFT_PRODUCT_PLACEHOLDER_IMAGE,
      blobUrl: null,
      blobPathname: null,
    };
  } else {
    throw new StoreUnavailableError("Une image est requise pour mettre en ligne.");
  }
  let uploadedBack: Awaited<ReturnType<typeof uploadProductImage>> | undefined;
  if (input.fileBack && input.fileBack.size > 0) {
    uploadedBack = await uploadProductImage(id, input.fileBack, "verso");
  }
  const product: AdminProduct = {
    id,
    sku: input.sku,
    name: input.name,
    variant: input.variant,
    description: input.description,
    fabrication: input.fabrication,
    limitedEdition: input.limitedEdition,
    materials: input.materials,
    sizeGuide: input.sizeGuide,
    printPlacement: input.printPlacement ?? "",
    category: input.category,
    price: input.price,
    sizes: input.sizes,
    stock: input.stock,
    publishStatus: input.publishStatus,
    colorDeclinations: input.colorDeclinations ?? [],
    imageUrl: uploaded.imageUrl,
    blobUrl: uploaded.blobUrl,
    blobPathname: uploaded.blobPathname,
    imageBackUrl: uploadedBack?.imageUrl ?? "",
    imageBackBlobUrl: uploadedBack?.blobUrl ?? null,
    imageBackBlobPathname: uploadedBack?.blobPathname ?? null,
    createdAt: new Date().toISOString(),
    isPinned: false,
    displayOrder: 0,
  };

  if (product.publishStatus === "live") {
    requirePublishableProduct(product);
  }

  return withStoreOptimistic((store) => {
    store.products = [product, ...store.products];
    return { store, result: product };
  }).then(async (created) => {
    const id = Number(created.id);
    if (Number.isInteger(id) && id > 0) {
      const seeded = await writeStockQuantity(id, created.stock);
      if (!seeded) await seedStockIfMissing(id, created.stock);
    }
    return created;
  });
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput> & ProductUpdateMedia & { stockDelta?: number },
  file?: File,
): Promise<AdminProduct | null> {
  let uploadedRecto: Awaited<ReturnType<typeof uploadProductImage>> | undefined;
  let uploadedVerso: Awaited<ReturnType<typeof uploadProductImage>> | undefined;
  let previousRecto: AdminProduct | undefined;
  let previousVerso: AdminProduct | undefined;
  let previousForClearBack: AdminProduct | undefined;
  let fields = { ...input };
  const rectoFile = file ?? fields.rectoFile;
  const versoFile = fields.versoFile;
  const clearImageBack = fields.clearImageBack === true;
  delete fields.rectoFile;
  delete fields.versoFile;
  delete fields.clearImageBack;

  const productId = Number(id);
  if (typeof fields.stockDelta === "number" && Number.isInteger(productId) && productId > 0) {
    const adjusted = await adjustStock(productId, fields.stockDelta);
    if (!adjusted.ok) {
      if (adjusted.code === "negative") {
        throw new ProductStockAdjustError(adjusted.error, adjusted.code);
      }
      if (adjusted.code === "missing") {
        const snapshot = await readStoreSnapshot();
        const current = snapshot === "missing" ? null : snapshot.store.products.find((p) => p.id === id);
        const baseline = Math.max(0, Math.floor(current?.stock ?? 0));
        const nextStock = Math.max(0, baseline + fields.stockDelta);
        const written = await writeStockQuantity(productId, nextStock);
        if (!written) await seedStockIfMissing(productId, nextStock);
        fields = { ...fields, stock: nextStock, stockDelta: undefined };
      } else {
        throw new ProductStockAdjustError(adjusted.error, adjusted.code);
      }
    } else {
      fields = { ...fields, stock: adjusted.quantity, stockDelta: undefined };
    }
  } else if (typeof fields.stock === "number" && Number.isInteger(productId) && productId > 0) {
    const targetStock = fields.stock;
    const snapshot = await readStoreSnapshot();
    const current = snapshot === "missing" ? null : snapshot.store.products.find((p) => p.id === id);
    const storedStock = current?.stock;
    const stockChanged =
      storedStock === undefined || Math.floor(storedStock) !== Math.floor(targetStock);

    if (stockChanged) {
      const redisQty = await readStockQuantity(productId);
      const baseline =
        redisQty === "missing" || redisQty === "unavailable"
          ? (storedStock ?? targetStock)
          : redisQty;
      const delta = targetStock - baseline;
      if (delta !== 0) {
        const adjusted = await adjustStock(productId, delta);
        if (!adjusted.ok) {
          if (adjusted.code === "negative") {
            throw new ProductStockAdjustError(adjusted.error, adjusted.code);
          }
          const written = await writeStockQuantity(productId, targetStock);
          if (!written) {
            await seedStockIfMissing(productId, targetStock);
          }
          fields = { ...fields, stock: targetStock };
        } else {
          fields = { ...fields, stock: adjusted.quantity };
        }
      } else {
        const written = await writeStockQuantity(productId, targetStock);
        if (!written) {
          try {
            await seedStockIfMissing(productId, targetStock);
          } catch (error) {
            console.error("[stock] seed admin", error instanceof Error ? error.name : "erreur");
          }
        }
      }
    }
  }

  if (rectoFile && rectoFile.size > 0) {
    let snap: StoreSnapshot | "missing";
    try {
      snap = await readStoreSnapshot();
    } catch (error) {
      console.error("[store] readStoreSnapshot upload", error instanceof Error ? error.name : "erreur");
      snap = "missing";
    }
    const base = snap === "missing" ? null : snap.store;
    previousRecto = base?.products.find((item) => item.id === id);
    if (!previousRecto) return null;
    uploadedRecto = await uploadProductImage(id, rectoFile, "recto");
  }

  if (versoFile && versoFile.size > 0) {
    let snap: StoreSnapshot | "missing";
    try {
      snap = await readStoreSnapshot();
    } catch (error) {
      console.error("[store] readStoreSnapshot upload verso", error instanceof Error ? error.name : "erreur");
      snap = "missing";
    }
    const base = snap === "missing" ? null : snap.store;
    previousVerso = base?.products.find((item) => item.id === id);
    if (!previousVerso) return null;
    uploadedVerso = await uploadProductImage(id, versoFile, "verso");
  }

  if (clearImageBack) {
    let snap: StoreSnapshot | "missing";
    try {
      snap = await readStoreSnapshot();
    } catch (error) {
      console.error("[store] readStoreSnapshot clearImageBack", error instanceof Error ? error.name : "erreur");
      snap = "missing";
    }
    const base = snap === "missing" ? null : snap.store;
    previousForClearBack = base?.products.find((item) => item.id === id);
    if (!previousForClearBack) return null;
  }

  return withStoreOptimistic((store) => {
    const product = store.products.find((item) => item.id === id);
    if (!product) {
      return { store, result: null, skipWrite: true };
    }

    if (typeof fields.sku === "string") product.sku = fields.sku;
    if (typeof fields.name === "string") product.name = fields.name;
    if (typeof fields.variant === "string") product.variant = fields.variant;
    if (typeof fields.description === "string") product.description = fields.description;
    if (typeof fields.fabrication === "string") product.fabrication = fields.fabrication;
    if (typeof fields.limitedEdition === "string") product.limitedEdition = fields.limitedEdition;
    if (typeof fields.materials === "string") product.materials = fields.materials;
    if (typeof fields.sizeGuide === "string") product.sizeGuide = fields.sizeGuide;
    if (fields.printPlacement !== undefined) product.printPlacement = fields.printPlacement;
    if (fields.category) product.category = fields.category;
    if (typeof fields.price === "number") product.price = fields.price;
    if (fields.sizes) product.sizes = fields.sizes;
    if (typeof fields.stock === "number") {
      product.stock = Math.max(0, Math.floor(fields.stock));
    }
    if (fields.publishStatus) {
      product.publishStatus = fields.publishStatus;
    }
    if (fields.colorDeclinations !== undefined) {
      product.colorDeclinations = fields.colorDeclinations;
    }
    if (typeof fields.isPinned === "boolean") {
      product.isPinned = fields.isPinned;
    }
    if (typeof fields.displayOrder === "number") {
      product.displayOrder = normalizeDisplayOrder(fields.displayOrder);
    }

    if (uploadedRecto) {
      product.imageUrl = uploadedRecto.imageUrl;
      product.blobUrl = uploadedRecto.blobUrl;
      product.blobPathname = uploadedRecto.blobPathname;
    } else if (fields.clearImage && product.publishStatus !== "live") {
      product.imageUrl = DRAFT_PRODUCT_PLACEHOLDER_IMAGE;
      product.blobUrl = null;
      product.blobPathname = null;
    }

    if (uploadedVerso) {
      product.imageBackUrl = uploadedVerso.imageUrl;
      product.imageBackBlobUrl = uploadedVerso.blobUrl;
      product.imageBackBlobPathname = uploadedVerso.blobPathname;
    } else if (clearImageBack) {
      product.imageBackUrl = "";
      product.imageBackBlobUrl = null;
      product.imageBackBlobPathname = null;
    }

    if (product.publishStatus === "live") {
      requirePublishableProduct(product);
    }

    return { store, result: product };
  }).then(async (updated) => {
    if (updated && rectoFile && previousRecto) {
      await deleteProductFaceMedia(previousRecto, "recto");
    }
    if (updated && versoFile && previousVerso) {
      await deleteProductFaceMedia(previousVerso, "verso");
    }
    if (updated && clearImageBack && previousForClearBack?.imageBackUrl.trim()) {
      await deleteProductFaceMedia(previousForClearBack, "verso");
    }
    return updated;
  });
}

export async function updateProductStock(id: string, nextStock: number): Promise<AdminProduct | null> {
  return updateProduct(id, { stock: nextStock });
}

function tombstoneCatalogPair(tombstone: Set<string>, id: string): void {
  tombstone.add(id);
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return;
  if (isVersoCatalogId(numericId)) {
    tombstone.add(String(resolveRectoCatalogId(numericId)));
    return;
  }
  for (const [verso, recto] of VERSO_TO_RECTO_CATALOG_ID) {
    if (recto === numericId) tombstone.add(String(verso));
  }
}

export async function removeProduct(id: string): Promise<boolean> {
  const removed = await withStoreOptimistic((store) => {
    const product = store.products.find((item) => item.id === id);
    if (!product) {
      return { store, result: null, skipWrite: true };
    }
    const copy = { ...product, sizes: [...product.sizes] };
    store.products = store.products.filter((item) => item.id !== id);
    if (SEEDED_PRODUCTS.some((seed) => seed.id === id)) {
      const tombstone = new Set(store.removedCatalogIds ?? []);
      tombstoneCatalogPair(tombstone, id);
      store.removedCatalogIds = [...tombstone];
      store.products = store.products.filter((item) => !tombstone.has(item.id));
    }
    return { store, result: copy };
  });

  if (!removed) return false;
  await deleteProductImage(removed);
  return true;
}

export async function findOrder(id: string): Promise<AdminOrder | undefined> {
  const snapshot = await readStoreSnapshot();
  if (snapshot === "missing") return undefined;
  return snapshot.store.orders.find((item) => item.id === id);
}

export async function insertOrderIfNew(order: AdminOrder): Promise<boolean> {
  return withStoreOptimistic((store) => {
    if (store.orders.some((item) => item.id === order.id)) {
      return { store, result: false, skipWrite: true };
    }
    store.orders = [order, ...store.orders];
    return { store, result: true };
  });
}

export type PatchOrderResult = { order: AdminOrder | null; changed: boolean };

function reviewReasonsEqual(
  left: AdminOrder["reviewReasons"],
  right: AdminOrder["reviewReasons"],
): boolean {
  const a = left ?? [];
  const b = right ?? [];
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function stockLinesEqual(
  left: AdminOrder["stockLines"],
  right: AdminOrder["stockLines"],
): boolean {
  const a = left ?? [];
  const b = right ?? [];
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].productId !== b[i].productId || a[i].qty !== b[i].qty) return false;
  }
  return true;
}

/** Comparaison champ par champ sur le patch (valeurs primitives / références explicites). */
export function orderPatchHasChanges(current: AdminOrder, patch: Partial<AdminOrder>): boolean {
  for (const key of Object.keys(patch) as (keyof AdminOrder)[]) {
    if (key === "reviewReasons") {
      if (!reviewReasonsEqual(current.reviewReasons, patch.reviewReasons)) return true;
      continue;
    }
    if (key === "stockLines") {
      if (!stockLinesEqual(current.stockLines, patch.stockLines)) return true;
      continue;
    }
    if (patch[key] !== current[key]) return true;
  }
  return false;
}

/** Met à jour une commande existante sans écraser les champs non mentionnés (version relue). */
export async function patchOrder(
  orderId: string,
  mutate: (current: AdminOrder) => Partial<AdminOrder>,
): Promise<PatchOrderResult> {
  return withStoreOptimistic<PatchOrderResult>((store) => {
    const index = store.orders.findIndex((item) => item.id === orderId);
    if (index < 0) {
      return { store, result: { order: null, changed: false }, skipWrite: true };
    }
    const current = store.orders[index];
    const patch = mutate(current);
    if (Object.keys(patch).length === 0) {
      return { store, result: { order: current, changed: false }, skipWrite: true };
    }
    if (!orderPatchHasChanges(current, patch)) {
      return { store, result: { order: current, changed: false }, skipWrite: true };
    }
    store.orders[index] = { ...current, ...patch };
    return { store, result: { order: store.orders[index], changed: true } };
  });
}

export async function uploadLookbookImage(
  slideId: string,
  file: File,
): Promise<{ imageUrl: string; blobUrl: string | null; blobPathname: string | null }> {
  const filename = `${safeFileName(file.name).replace(/\.[^.]+$/, "") || "image"}.webp`;
  const pathname = `dingry/lookbook/${slideId}/${filename}`;

  /** Aligné sur {@link uploadProductImage} : en dev, fichier local (token Blob souvent lecture seule). */
  if (useLocalStoreFiles()) {
    await mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
    const localName = `lookbook-${slideId}-${Date.now()}-${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(LOCAL_UPLOADS_DIR, localName), bytes);
    return {
      imageUrl: `/admin-uploads/${localName}`,
      blobUrl: null,
      blobPathname: null,
    };
  }

  if (isBlobConfigured()) {
    try {
      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: "image/webp",
      });
      return {
        imageUrl: blob.url,
        blobUrl: blob.url,
        blobPathname: blob.pathname,
      };
    } catch (error) {
      console.error("[store] upload Blob lookbook", error instanceof Error ? error.name : "erreur");
      throw new StoreUnavailableError("Upload image impossible (Vercel Blob).");
    }
  }

  throw new StoreUnavailableError("Stockage image indisponible.");
}

async function deleteLookbookImage(slide: AdminLookbookSlide): Promise<void> {
  if (slide.blobUrl) {
    await del(slide.blobUrl);
    return;
  }
  if (slide.blobPathname) {
    await del(slide.blobPathname);
    return;
  }
  await deleteLocalUpload(slide.imageUrl);
}

function nextLookbookId(slides: AdminLookbookSlide[]): string {
  const max = slides.reduce((current, item) => {
    const match = /^lb-(\d+)$/.exec(item.id);
    if (!match) return current;
    const value = Number(match[1]);
    return Number.isInteger(value) && value > current ? value : current;
  }, 0);
  return `lb-${max + 1}`;
}

function sortLookbook(slides: AdminLookbookSlide[]): AdminLookbookSlide[] {
  return [...slides].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export type LookbookInput = {
  title: string;
  caption: string;
  sortOrder?: number;
};

export async function createLookbookSlide(input: LookbookInput & { file: File }): Promise<AdminLookbookSlide> {
  const snapshot = await readStoreSnapshot();
  const base = snapshot === "missing" ? normalizeStore(createSeededStore()) : snapshot.store;
  const id = nextLookbookId(base.lookbook);
  const uploaded = await uploadLookbookImage(id, input.file);
  const sortOrder = input.sortOrder ?? base.lookbook.length;
  const slide: AdminLookbookSlide = {
    id,
    title: input.title,
    caption: input.caption,
    imageUrl: uploaded.imageUrl,
    blobUrl: uploaded.blobUrl,
    blobPathname: uploaded.blobPathname,
    sortOrder,
    createdAt: new Date().toISOString(),
  };

  return withStoreOptimistic((store) => {
    store.lookbook = sortLookbook([...store.lookbook, slide]);
    return { store, result: slide };
  });
}

export async function updateLookbookSlide(
  id: string,
  input: Partial<LookbookInput>,
  file?: File,
): Promise<AdminLookbookSlide | null> {
  let uploaded: Awaited<ReturnType<typeof uploadLookbookImage>> | undefined;
  let previous: AdminLookbookSlide | undefined;

  if (file) {
    uploaded = await uploadLookbookImage(id, file);
  }

  return withStoreOptimistic((store) => {
    const index = store.lookbook.findIndex((item) => item.id === id);
    if (index < 0) {
      return { store, result: null, skipWrite: true };
    }
    previous = { ...store.lookbook[index] };
    const next: AdminLookbookSlide = {
      ...store.lookbook[index],
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(uploaded
        ? {
            imageUrl: uploaded.imageUrl,
            blobUrl: uploaded.blobUrl,
            blobPathname: uploaded.blobPathname,
          }
        : {}),
    };
    store.lookbook[index] = next;
    store.lookbook = sortLookbook(store.lookbook);
    return { store, result: next };
  }).then(async (updated) => {
    if (uploaded && previous && updated) {
      await deleteLookbookImage(previous);
    }
    return updated;
  });
}

export async function removeLookbookSlide(id: string): Promise<boolean> {
  const removed = await withStoreOptimistic((store) => {
    const slide = store.lookbook.find((item) => item.id === id);
    if (!slide) {
      return { store, result: null, skipWrite: true };
    }
    const copy = { ...slide };
    store.lookbook = store.lookbook.filter((item) => item.id !== id);
    return { store, result: copy };
  });

  if (!removed) return false;
  if (removed.blobUrl || removed.blobPathname || removed.imageUrl.startsWith("/admin-uploads/")) {
    await deleteLookbookImage(removed);
  }
  return true;
}

export async function reorderLookbookSlide(id: string, direction: "up" | "down"): Promise<AdminLookbookSlide[] | null> {
  return withStoreOptimistic((store) => {
    const ordered = sortLookbook(store.lookbook);
    const index = ordered.findIndex((item) => item.id === id);
    if (index < 0) {
      return { store, result: null, skipWrite: true };
    }
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= ordered.length) {
      return { store, result: ordered, skipWrite: true };
    }
    const current = ordered[index];
    const swap = ordered[swapIndex];
    store.lookbook = sortLookbook(
      store.lookbook.map((item) => {
        if (item.id === current.id) return { ...item, sortOrder: swap.sortOrder };
        if (item.id === swap.id) return { ...item, sortOrder: current.sortOrder };
        return item;
      }),
    );
    return { store, result: sortLookbook(store.lookbook) };
  });
}
