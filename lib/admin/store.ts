import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { isBlobConfigured } from "@/lib/admin/auth";
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

async function readRawStoreFromBlob(): Promise<AdminStore | null> {
  try {
    const result = await get(STORE_PATHNAME, { access: "public", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    const parsed: unknown = JSON.parse(text);
    if (!isAdminStore(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeStoreToBlob(store: AdminStore): Promise<void> {
  await put(STORE_PATHNAME, JSON.stringify(store), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

async function readRawStoreFromDisk(): Promise<AdminStore | null> {
  try {
    const text = await readFile(LOCAL_STORE_PATH, "utf8");
    const parsed: unknown = JSON.parse(text);
    if (!isAdminStore(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeStoreToDisk(store: AdminStore): Promise<void> {
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function persistMigratedStore(raw: AdminStore): Promise<AdminStore> {
  const normalized = normalizeStore(raw);
  if (raw.version !== STORE_VERSION) {
    await saveStore(normalized);
  }
  return normalized;
}

export async function loadStore(): Promise<AdminStore> {
  if (isBlobConfigured()) {
    const fromBlob = await readRawStoreFromBlob();
    if (fromBlob) return persistMigratedStore(fromBlob);
    const seeded = createSeededStore();
    await writeStoreToBlob(seeded);
    return seeded;
  }

  const fromDisk = await readRawStoreFromDisk();
  if (fromDisk) return persistMigratedStore(fromDisk);
  const seeded = createSeededStore();
  await writeStoreToDisk(seeded);
  return seeded;
}

export async function saveStore(store: AdminStore): Promise<void> {
  const next: AdminStore = { ...store, version: STORE_VERSION };
  if (isBlobConfigured()) {
    await writeStoreToBlob(next);
    return;
  }
  await writeStoreToDisk(next);
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
  const store = await loadStore();
  const id = nextProductId(store.products);
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

  store.products = [product, ...store.products];
  await saveStore(store);
  return product;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput> & { stockDelta?: number },
  file?: File,
): Promise<AdminProduct | null> {
  const store = await loadStore();
  const product = store.products.find((item) => item.id === id);
  if (!product) return null;

  if (typeof input.sku === "string") product.sku = input.sku;
  if (typeof input.name === "string") product.name = input.name;
  if (typeof input.variant === "string") product.variant = input.variant;
  if (typeof input.description === "string") product.description = input.description;
  if (input.category) product.category = input.category;
  if (typeof input.price === "number") product.price = input.price;
  if (input.sizes) product.sizes = input.sizes;
  if (typeof input.stock === "number") {
    product.stock = Math.max(0, Math.floor(input.stock));
  } else if (typeof input.stockDelta === "number") {
    product.stock = Math.max(0, Math.floor(product.stock + input.stockDelta));
  }

  if (file) {
    await deleteProductImage(product);
    const uploaded = await uploadProductImage(id, file);
    product.imageUrl = uploaded.imageUrl;
    product.blobUrl = uploaded.blobUrl;
    product.blobPathname = uploaded.blobPathname;
  }

  await saveStore(store);
  return product;
}

export async function updateProductStock(id: string, nextStock: number): Promise<AdminProduct | null> {
  return updateProduct(id, { stock: nextStock });
}

export async function removeProduct(id: string): Promise<boolean> {
  const store = await loadStore();
  const product = store.products.find((item) => item.id === id);
  if (!product) return false;
  await deleteProductImage(product);
  store.products = store.products.filter((item) => item.id !== id);
  await saveStore(store);
  return true;
}

export async function findOrder(id: string): Promise<AdminOrder | undefined> {
  const store = await loadStore();
  return store.orders.find((item) => item.id === id);
}

export async function insertOrderIfNew(order: AdminOrder): Promise<boolean> {
  const store = await loadStore();
  if (store.orders.some((item) => item.id === order.id)) return false;
  store.orders = [order, ...store.orders];
  await saveStore(store);
  return true;
}

export async function upsertOrder(order: AdminOrder): Promise<AdminOrder> {
  const store = await loadStore();
  const index = store.orders.findIndex((item) => item.id === order.id);
  if (index >= 0) {
    store.orders[index] = order;
  } else {
    store.orders = [order, ...store.orders];
  }
  await saveStore(store);
  return order;
}
