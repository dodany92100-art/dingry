import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobPreconditionFailedError, del, get, put } from "@vercel/blob";
import { isBlobConfigured } from "@/lib/admin/blob-config";
import { adjustStock, readStockQuantity, seedCatalogStockFromProducts, seedStockIfMissing } from "@/lib/stock";
import { createSeededStore, SEEDED_PRODUCTS } from "@/lib/admin/seed";
import { CATALOG_CANONICAL_IMAGE_BY_ID, DINGRY_JERSEY_PRODUCT_IDS, DINGRY_SWEAT_PRODUCT_IDS, DINGRY_TEE_PRODUCT_IDS } from "@/lib/dingry-product-media";
import {
  isProductCategory,
  isProductSize,
  STORE_VERSION,
  type AdminOrder,
  type AdminProduct,
  type AdminStore,
  type ProductCategory,
  type ProductSize,
} from "@/lib/admin/types";

const STORE_PATHNAME = "dingry/admin/store.json";
const LOCAL_STORE_PATH = path.join(process.cwd(), "data", "admin", "store.json");
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "admin-uploads");
const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
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

type StoreSnapshot = {
  store: AdminStore;
  etag: string | null;
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
  };
}

function assertStoreBackend(): void {
  if (process.env.NODE_ENV === "production" && !isBlobConfigured()) {
    throw new StoreUnavailableError("BLOB_READ_WRITE_TOKEN requis en production.");
  }
}

function useLocalStoreFiles(): boolean {
  return process.env.NODE_ENV !== "production" && !isBlobConfigured();
}

async function readStoreSnapshot(): Promise<StoreSnapshot | "missing"> {
  assertStoreBackend();

  if (isBlobConfigured()) {
    const result = await get(STORE_PATHNAME, { access: "public", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return "missing";
    const text = await new Response(result.stream).text();
    const parsed: unknown = JSON.parse(text);
    if (!isAdminStore(parsed)) return "missing";
    const raw = parsed as AdminStore;
    return {
      store: normalizeStore(raw),
      etag: result.blob.etag,
    };
  }

  if (!useLocalStoreFiles()) {
    throw new StoreUnavailableError();
  }

  try {
    const text = await readFile(LOCAL_STORE_PATH, "utf8");
    const parsed: unknown = JSON.parse(text);
    if (!isAdminStore(parsed)) return "missing";
    const raw = parsed as AdminStore;
    return {
      store: normalizeStore(raw),
      etag: revisionFromDiskText(text),
    };
  } catch {
    return "missing";
  }
}

async function writeStoreSnapshot(store: AdminStore, etag: string | null): Promise<void> {
  assertStoreBackend();
  const next: AdminStore = { ...store, version: STORE_VERSION };
  const body = JSON.stringify(next);

  if (isBlobConfigured()) {
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

  if (!useLocalStoreFiles()) {
    throw new StoreUnavailableError();
  }

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

  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(next, null, 2), "utf8");
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
  const imageUrl = String(record.imageUrl ?? "").trim();
  if (!id || !name || !imageUrl || !Number.isFinite(price) || price <= 0) return null;

  const sizes = Array.isArray(record.sizes)
    ? record.sizes.filter((item): item is ProductSize => typeof item === "string" && isProductSize(item))
    : (["S", "M", "L", "XL"] as ProductSize[]);

  const categoryValue = String(record.category ?? "Tee");
  const category: ProductCategory = isProductCategory(categoryValue) ? categoryValue : "Tee";

  return {
    id,
    sku: String(record.sku ?? `DINGRY-${id}`).trim() || `DINGRY-${id}`,
    name,
    variant: String(record.variant ?? "").trim(),
    description: String(record.description ?? "").trim(),
    category,
    price,
    sizes: sizes.length > 0 ? sizes : ["S", "M", "L", "XL"],
    stock: Math.max(0, Math.floor(Number(record.stock) || 0)),
    imageUrl,
    blobUrl: typeof record.blobUrl === "string" ? record.blobUrl : null,
    blobPathname: typeof record.blobPathname === "string" ? record.blobPathname : null,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
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
  const genericCategory = current.category === "Tee" && seed.category !== "Tee";
  if (catalogLocked) {
    return {
      ...seed,
      ...current,
      imageUrl:
        canonicalImage ??
        (DINGRY_JERSEY_PRODUCT_IDS.has(seedIdNum) && current.imageUrl ? current.imageUrl : seed.imageUrl),
      category: DINGRY_SWEAT_PRODUCT_IDS.has(seedIdNum)
        ? "Sweats"
        : DINGRY_TEE_PRODUCT_IDS.has(seedIdNum)
          ? "Tee"
          : DINGRY_JERSEY_PRODUCT_IDS.has(seedIdNum)
            ? "Jersey"
            : genericCategory
              ? seed.category
              : current.category,
      name: current.name.includes(" — ") ? seed.name : current.name,
      variant: current.variant.trim() || seed.variant,
      description: current.description.trim() || seed.description,
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
    category: genericCategory ? seed.category : current.category,
    name: current.name.includes(" — ") ? seed.name : current.name,
    sizes: current.sizes.length > 0 ? current.sizes : [...seed.sizes],
  };
}

function migrateStore(raw: AdminStore): AdminStore {
  const existing = raw.products
    .map(normalizeProduct)
    .filter((item): item is AdminProduct => item !== null);
  const byId = new Map(existing.map((item) => [item.id, item]));

  if (raw.version === STORE_VERSION && existing.length > 0) {
    const mergedSeed = SEEDED_PRODUCTS.map((seed) => mergeSeedProduct(seed, byId.get(seed.id)));
    const extras = existing.filter((item) => !SEEDED_PRODUCTS.some((seed) => seed.id === item.id));
    return {
      version: STORE_VERSION,
      products: [...mergedSeed, ...extras],
      orders: raw.orders,
    };
  }

  const mergedSeed = SEEDED_PRODUCTS.map((seed) => mergeSeedProduct(seed, byId.get(seed.id)));
  const extras = existing.filter((item) => !SEEDED_PRODUCTS.some((seed) => seed.id === item.id));

  return {
    version: STORE_VERSION,
    products: [...mergedSeed, ...extras],
    orders: raw.orders,
  };
}

function normalizeStore(value: AdminStore): AdminStore {
  return migrateStore({
    version: typeof value.version === "number" ? value.version : 0,
    products: Array.isArray(value.products) ? value.products : [],
    orders: Array.isArray(value.orders) ? value.orders : [],
  });
}

/** Lecture seule : aucune écriture Blob (catalogue, devis, findOrder). */
export async function loadStoreReadOnly(): Promise<AdminStore> {
  const snapshot = await readStoreSnapshot();
  if (snapshot === "missing") {
    return normalizeStore(createSeededStore());
  }
  return snapshot.store;
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
    return "Image trop lourde (1 Mo maximum après conversion).";
  }
  return null;
}

export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<{ imageUrl: string; blobUrl: string | null; blobPathname: string | null }> {
  const filename = `${safeFileName(file.name).replace(/\.[^.]+$/, "") || "image"}.webp`;
  const pathname = `dingry/products/${productId}/${filename}`;

  if (isBlobConfigured()) {
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
  }

  if (!useLocalStoreFiles()) {
    throw new StoreUnavailableError();
  }

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

export async function deleteProductImage(product: AdminProduct): Promise<void> {
  if (product.blobUrl) {
    await del(product.blobUrl);
    return;
  }
  if (product.blobPathname) {
    await del(product.blobPathname);
    return;
  }
  await deleteLocalUpload(product.imageUrl);
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
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  stock: number;
};

export async function createProduct(input: ProductInput & { file: File }): Promise<AdminProduct> {
  const snapshot = await readStoreSnapshot();
  const base = snapshot === "missing" ? normalizeStore(createSeededStore()) : snapshot.store;
  const id = nextProductId(base.products);
  const uploaded = await uploadProductImage(id, input.file);
  const product: AdminProduct = {
    id,
    sku: input.sku,
    name: input.name,
    variant: input.variant,
    description: input.description,
    category: input.category,
    price: input.price,
    sizes: input.sizes,
    stock: input.stock,
    imageUrl: uploaded.imageUrl,
    blobUrl: uploaded.blobUrl,
    blobPathname: uploaded.blobPathname,
    createdAt: new Date().toISOString(),
  };

  return withStoreOptimistic((store) => {
    store.products = [product, ...store.products];
    return { store, result: product };
  }).then(async (created) => {
    await seedStockIfMissing(Number(created.id), created.stock);
    return created;
  });
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput> & { stockDelta?: number },
  file?: File,
): Promise<AdminProduct | null> {
  let uploaded: Awaited<ReturnType<typeof uploadProductImage>> | undefined;
  let previous: AdminProduct | undefined;
  let fields = { ...input };

  const productId = Number(id);
  if (typeof fields.stockDelta === "number" && Number.isInteger(productId) && productId > 0) {
    const adjusted = await adjustStock(productId, fields.stockDelta);
    if (!adjusted.ok) {
      throw new StoreConflictError();
    }
    fields = { ...fields, stock: adjusted.quantity, stockDelta: undefined };
  } else if (typeof fields.stock === "number" && Number.isInteger(productId) && productId > 0) {
    const targetStock = fields.stock;
    const snapshot = await readStoreSnapshot();
    const current = snapshot === "missing" ? null : snapshot.store.products.find((p) => p.id === id);
    const redisQty = await readStockQuantity(productId);
    const baseline =
      redisQty === "missing" || redisQty === "unavailable"
        ? (current?.stock ?? targetStock)
        : redisQty;
    const delta = targetStock - baseline;
    if (delta !== 0) {
      const adjusted = await adjustStock(productId, delta);
      if (!adjusted.ok) {
        throw new StoreConflictError();
      }
      fields = { ...fields, stock: adjusted.quantity };
    }
    await seedStockIfMissing(productId, targetStock);
  }

  if (file) {
    const snapshot = await readStoreSnapshot();
    const base = snapshot === "missing" ? null : snapshot.store;
    previous = base?.products.find((item) => item.id === id);
    if (!previous) return null;
    uploaded = await uploadProductImage(id, file);
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
    if (fields.category) product.category = fields.category;
    if (typeof fields.price === "number") product.price = fields.price;
    if (fields.sizes) product.sizes = fields.sizes;
    if (typeof fields.stock === "number") {
      product.stock = Math.max(0, Math.floor(fields.stock));
    }

    if (uploaded) {
      product.imageUrl = uploaded.imageUrl;
      product.blobUrl = uploaded.blobUrl;
      product.blobPathname = uploaded.blobPathname;
    }

    return { store, result: product };
  }).then(async (updated) => {
    if (updated && file && previous) {
      await deleteProductImage(previous);
    }
    return updated;
  });
}

export async function updateProductStock(id: string, nextStock: number): Promise<AdminProduct | null> {
  return updateProduct(id, { stock: nextStock });
}

export async function removeProduct(id: string): Promise<boolean> {
  const removed = await withStoreOptimistic((store) => {
    const product = store.products.find((item) => item.id === id);
    if (!product) {
      return { store, result: null, skipWrite: true };
    }
    const copy = { ...product, sizes: [...product.sizes] };
    store.products = store.products.filter((item) => item.id !== id);
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

export async function upsertOrder(order: AdminOrder): Promise<AdminOrder> {
  return withStoreOptimistic((store) => {
    const index = store.orders.findIndex((item) => item.id === order.id);
    if (index >= 0) {
      store.orders[index] = order;
    } else {
      store.orders = [order, ...store.orders];
    }
    return { store, result: order };
  });
}

export type PatchOrderResult = { order: AdminOrder | null; changed: boolean };

/** Comparaison champ par champ sur le patch (valeurs primitives / références explicites). */
export function orderPatchHasChanges(current: AdminOrder, patch: Partial<AdminOrder>): boolean {
  for (const key of Object.keys(patch) as (keyof AdminOrder)[]) {
    if (patch[key] !== current[key]) return true;
  }
  return false;
}

/** Met à jour une commande existante sans écraser les champs non mentionnés (version relue). */
export async function patchOrder(
  orderId: string,
  mutate: (current: AdminOrder) => Partial<AdminOrder>,
): Promise<PatchOrderResult> {
  return withStoreOptimistic((store) => {
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
