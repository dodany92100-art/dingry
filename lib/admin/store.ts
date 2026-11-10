import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  allowCatalogSeedFallback,
  hasProductionCatalogBackend,
  isSupabaseCatalogEnvComplete,
} from "@/lib/admin/blob-config";
import {
  isStoreWriteConflict,
  CatalogMakerDuplicateError,
  PriceFamilyDuplicateError,
  StoreConflictError,
  StoreUnavailableError,
} from "@/lib/admin/store-errors";
import {
  materializeCatalogMakerTemplate,
  validateCatalogMakerTemplate,
  type CatalogMakerTemplate,
} from "@/lib/validations/catalog-maker-template";
import {
  materializePriceFamily,
  priceFamilyDraftFromProductFields,
  validatePriceFamilyDraft,
  type PriceFamily,
} from "@/lib/validations/price-family";
import { readFileStoreSnapshot, writeFileStoreSnapshot } from "@/lib/admin/store-snapshot-file";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { deleteR2PublicImage, isR2ImageStorageEnabled, r2ObjectKey, uploadR2PublicImage } from "@/lib/r2/storage";
import { isR2PublicUrl } from "@/lib/r2/config";
import { isVercelBlobUrl, removePublicImage } from "@/lib/supabase/storage";
import {
  addRemovedCatalogIds,
  deleteSupabaseProduct,
  getSupabaseProduct,
  listRemovedCatalogIds,
  listSupabaseProducts,
  nextSupabaseProductId,
  reorderSupabaseProducts,
  upsertSupabaseProduct,
} from "@/lib/supabase/admin-products";
import { getSharedRedis } from "@/lib/ratelimit";
import { adjustStock, readStockQuantity, seedCatalogStockFromProducts, seedStockIfMissing, writeStockQuantity } from "@/lib/stock";
import { buildStorefrontOnlineProducts } from "@/lib/admin/storefront-online-catalog";
import {
  createSeededStore,
  DEFAULT_REMOVED_CATALOG_IDS,
  RESTORED_CATALOG_SEED_IDS,
  SEEDED_PRODUCTS,
} from "@/lib/admin/seed";
import { PRODUCTS } from "@/lib/shop-data";
import { assertPublishableProduct, requirePublishableProduct } from "@/lib/admin/assert-publishable";
import {
  DEFAULT_REMOVED_LOOKBOOK_SLIDE_IDS,
  RETIRED_LOOKBOOK_SEED_TITLES,
  seededLookbookSlides,
} from "@/lib/admin/lookbook-seed";
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
  type AdminCatalogPersoBanner,
  type AdminLookbookSlide,
  type AdminLookbookSlideView,
  type AdminOrder,
  type AdminProduct,
  type AdminStore,
  parseColorDeclinations,
  type ProductCategory,
  type ProductPrintPlacement,
  type ProductPublishStatus,
  type ProductSize,
} from "@/lib/admin/types";
import { reconcileDropBatchWithCatalog, type DropBatchItem } from "@/lib/admin/drop-batch";
import {
  applyDisplayOrderByIds,
  normalizeDisplayOrder,
  normalizeIsPinned,
} from "@/lib/admin/product-display-order";
import { DEFAULT_CATALOG_PERSO_BANNER } from "@/lib/catalog-perso-banner";
import { orderPatchHasChanges } from "@/lib/admin/store-order-patch";

export { orderPatchHasChanges } from "@/lib/admin/store-order-patch";

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "admin-uploads");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/webp"]);
const STORE_WRITE_ATTEMPTS = 8;
const STORE_LOCK_KEY = "dingry:store-lock";
const STORE_LOCK_TTL_SECONDS = 20;
const STORE_LOCK_WAIT_ATTEMPTS = 25;

/** Une file par processus : évite les conflits etag entre requêtes API concurrentes (dev / sauvegarde + stock). */
let storeWriteQueue: Promise<unknown> = Promise.resolve();

function enqueueStoreWrite<T>(task: () => Promise<T>): Promise<T> {
  const next = storeWriteQueue.then(task, task);
  storeWriteQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

const STORE_LOCK_RELEASE_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0`;

async function acquireStoreLock(): Promise<string | null> {
  const client = getSharedRedis();
  if (!client) return null;
  const token = randomUUID();
  for (let attempt = 0; attempt < STORE_LOCK_WAIT_ATTEMPTS; attempt++) {
    try {
      const result = await client.set(STORE_LOCK_KEY, token, { nx: true, ex: STORE_LOCK_TTL_SECONDS });
      if (result === "OK") return token;
    } catch (error) {
      console.error("[store] lock Redis", error instanceof Error ? error.name : "erreur");
      return null;
    }
    await new Promise((resolve) => setTimeout(resolve, 40 + attempt * 20));
  }
  throw new StoreConflictError();
}

async function releaseStoreLock(token: string | null): Promise<void> {
  if (!token) return;
  const client = getSharedRedis();
  if (!client) return;
  try {
    await client.eval(STORE_LOCK_RELEASE_LUA, [STORE_LOCK_KEY], [token]);
  } catch (error) {
    console.error("[store] unlock Redis", error instanceof Error ? error.name : "erreur");
  }
}

export {
  isStoreWriteConflict,
  StoreConflictError,
  StoreUnavailableError,
} from "@/lib/admin/store-errors";

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

function storeWriteBackoff(attempt: number): Promise<void> {
  const ms = 80 + Math.random() * 120 + attempt * 40;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneStore(store: AdminStore): AdminStore {
  return {
    ...store,
    products: store.products.map((product) => ({ ...product, sizes: [...product.sizes] })),
    orders: store.orders.map((order) => ({ ...order })),
    lookbook: store.lookbook.map((slide) => ({ ...slide })),
    ...(store.catalogPersoBanner ? { catalogPersoBanner: { ...store.catalogPersoBanner } } : {}),
  };
}

function assertStoreBackend(): void {
  if (!hasProductionCatalogBackend()) {
    throw new StoreUnavailableError(
      "Stockage CRM manquant en production : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (et R2 pour les uploads images).",
    );
  }
}

/** En local le token Blob lit mais l'API d'écriture répond 403. Le fichier local fait foi. */
function useLocalStoreFiles(): boolean {
  return process.env.NODE_ENV !== "production";
}

async function readStoreSnapshot(): Promise<StoreSnapshot | "missing"> {
  assertStoreBackend();
  let file: Awaited<ReturnType<typeof readFileStoreSnapshot>>;
  try {
    file = await readFileStoreSnapshot();
  } catch (error) {
    if (error instanceof StoreUnavailableError) throw error;
    throw new StoreUnavailableError();
  }
  if (file !== "missing") return file;
  if (allowCatalogSeedFallback()) return "missing";
  if (isSupabaseCatalogEnvComplete()) return "missing";
  throw new StoreUnavailableError();
}

async function writeStoreSnapshot(
  store: AdminStore,
  etag: string | null,
  createIfAbsent = false,
): Promise<void> {
  assertStoreBackend();
  const next: AdminStore = { ...store, version: STORE_VERSION };
  if (useLocalStoreFiles() && !etag && !createIfAbsent) {
    await writeFileStoreSnapshot(next, null);
    return;
  }
  await writeFileStoreSnapshot(next, etag, { createIfAbsent });
}

/** Magasin Blob absent (404) : premier enregistrement uniquement (pas d’écrasement). */
function snapshotForMissingWrite(): StoreSnapshot {
  return {
    store: normalizeStore(createSeededStore()),
    etag: null,
  };
}

type StoreOptimisticOptions = {
  /** CRM produit : après conflits etag, rejoue sur le store frais (mono-éditeur, pas les commandes PayPal). */
  adminRelaxedFinalize?: boolean;
};

async function writeStoreSnapshotRelaxed(store: AdminStore): Promise<void> {
  assertStoreBackend();
  await writeFileStoreSnapshot({ ...store, version: STORE_VERSION }, null);
}

async function withStoreOptimistic<T>(
  mutate: (store: AdminStore) => { store: AdminStore; result: T; skipWrite?: boolean },
  options?: StoreOptimisticOptions,
): Promise<T> {
  return enqueueStoreWrite(async () => {
    const lockToken = await acquireStoreLock();
    try {
    for (let attempt = 0; attempt < STORE_WRITE_ATTEMPTS; attempt++) {
      let snapshot = await readStoreSnapshot();
      let createIfAbsent = false;
      if (snapshot === "missing") {
        if (useLocalStoreFiles() || allowCatalogSeedFallback() || isSupabaseCatalogEnvComplete()) {
          snapshot = snapshotForMissingWrite();
          createIfAbsent = true;
        } else {
          throw new StoreUnavailableError();
        }
      }

      const working = cloneStore(snapshot.store);
      const outcome = mutate(working);
      if (outcome.skipWrite) return outcome.result;

      try {
        await writeStoreSnapshot(outcome.store, snapshot.etag, createIfAbsent);
        return outcome.result;
      } catch (error) {
        if (!isStoreWriteConflict(error)) throw error;
        await storeWriteBackoff(attempt);
      }
    }

    if (options?.adminRelaxedFinalize) {
      const latest = await readStoreSnapshot();
      if (latest !== "missing") {
        const replay = mutate(cloneStore(latest.store));
        if (replay.skipWrite) return replay.result;
        await writeStoreSnapshotRelaxed(replay.store);
        return replay.result;
      }
    }

    throw new StoreConflictError();
    } finally {
      await releaseStoreLock(lockToken);
    }
  });
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
  const liveImage = current.imageUrl.trim();
  const crmImage =
    liveImage && !isDraftPlaceholderImage(liveImage)
      ? liveImage
      : (canonicalImage ?? seed.imageUrl);

  if (catalogLocked) {
    const resolvedCategory = current
      ? normalizeProductCategory(current.category)
      : DINGRY_SWEAT_PRODUCT_IDS.has(seedIdNum)
        ? "Crewnecks"
        : DINGRY_TEE_PRODUCT_IDS.has(seedIdNum)
          ? "T-shirts"
          : DINGRY_JERSEY_PRODUCT_IDS.has(seedIdNum)
            ? "Jerseys"
            : normalizeProductCategory(seed.category);
    return {
      ...seed,
      ...current,
      imageUrl: crmImage,
      category: resolvedCategory,
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
    imageUrl: crmImage,
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

function removedLookbookSlideIdSet(raw: AdminStore): Set<string> {
  return new Set(
    [
      ...DEFAULT_REMOVED_LOOKBOOK_SLIDE_IDS,
      ...(Array.isArray(raw.removedLookbookSlideIds) ? raw.removedLookbookSlideIds : []),
    ]
      .map((id) => String(id).trim())
      .filter(Boolean),
  );
}

/** Lookbook boutique : seed + CRM, hors tombstones (y compris défauts code). */
export function publicLookbookSlides(raw: AdminStore): AdminLookbookSlide[] {
  return mergeLookbookSlides(raw);
}

/** Admin lookbook : même liste que la vitrine, avec origine stockée vs seed. */
export function adminLookbookSlideViews(raw: AdminStore): AdminLookbookSlideView[] {
  const storedIds = new Set(raw.lookbook.map((slide) => slide.id));
  return publicLookbookSlides(raw).map((slide) => ({
    ...slide,
    source: storedIds.has(slide.id) ? "stored" : "seed",
  }));
}

function normalizeCatalogPersoBannerRecord(value: unknown): AdminCatalogPersoBanner | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const imageUrl = typeof record.imageUrl === "string" ? record.imageUrl.trim() : "";
  if (!imageUrl) return undefined;
  return {
    enabled: record.enabled !== false,
    imageUrl,
    blobUrl: typeof record.blobUrl === "string" ? record.blobUrl : null,
    blobPathname: typeof record.blobPathname === "string" ? record.blobPathname : null,
    eyebrow: typeof record.eyebrow === "string" ? record.eyebrow.trim() : "",
    title: typeof record.title === "string" ? record.title.trim() : "",
    subtitle: typeof record.subtitle === "string" ? record.subtitle.trim() : "",
    ctaLabel: typeof record.ctaLabel === "string" ? record.ctaLabel.trim() : "",
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString(),
  };
}

function mergeLookbookSlides(raw: AdminStore): AdminLookbookSlide[] {
  const tombstone = removedLookbookSlideIdSet(raw);
  const isRetiredLookbookSlide = (item: AdminLookbookSlide) =>
    tombstone.has(item.id) || RETIRED_LOOKBOOK_SEED_TITLES.has(item.title);

  const seeded = seededLookbookSlides().filter((item) => !isRetiredLookbookSlide(item));
  const existing = (Array.isArray(raw.lookbook) ? raw.lookbook : [])
    .map(normalizeLookbookSlide)
    .filter((item): item is AdminLookbookSlide => item !== null)
    .filter((item) => !isRetiredLookbookSlide(item))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (existing.length === 0) return seeded;
  return existing;
}

/** v12 : une fiche recto peut porter recto + verso ; les anciennes fiches « — VERSO » alimentent `imageBackUrl`. */
function normalizePriceFamily(value: unknown): PriceFamily | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const category = normalizeProductCategory(String(record.category ?? ""));
  if (!isProductCategory(category)) return null;
  const sizesRaw = Array.isArray(record.sizes) ? record.sizes : [];
  const sizes = sizesRaw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => isProductSize(item));
  if (sizes.length === 0) return null;
  const priceTtc = Number(record.priceTtc);
  if (!Number.isFinite(priceTtc) || priceTtc <= 0) return null;
  const canonicalId = String(record.canonicalId ?? record.id ?? "").trim();
  if (!canonicalId) return null;
  const modelName = String(record.modelName ?? "").trim();
  const displayName = String(record.displayName ?? modelName).trim();
  if (!modelName || !displayName) return null;
  const draft = priceFamilyDraftFromProductFields({
    name: modelName,
    category,
    variant: String(record.color ?? "").trim(),
    price: priceTtc,
    sizes,
    sourceProductId:
      typeof record.sourceProductId === "string" ? record.sourceProductId : undefined,
  });
  draft.displayName = displayName;
  const createdAt =
    typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString();
  const updatedAt =
    typeof record.updatedAt === "string" ? record.updatedAt : createdAt;
  const materialized = materializePriceFamily(draft, canonicalId, createdAt);
  return { ...materialized, updatedAt };
}

function normalizePriceFamilies(raw: unknown): PriceFamily[] {
  if (!Array.isArray(raw)) return [];
  const out: PriceFamily[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const family = normalizePriceFamily(item);
    if (!family || seen.has(family.canonicalId)) continue;
    seen.add(family.canonicalId);
    out.push(family);
  }
  out.sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
  return out;
}

function resolveStorePriceFamilies(raw: AdminStore): PriceFamily[] {
  return raw.version >= STORE_VERSION ? normalizePriceFamilies(raw.priceFamilies) : [];
}

function normalizeMakerTemplate(value: unknown): CatalogMakerTemplate | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const category = normalizeProductCategory(String(record.category ?? ""));
  if (!isProductCategory(category)) return null;
  const id = String(record.id ?? "").trim();
  const label = String(record.label ?? "").trim();
  if (!id || !label) return null;
  const priceTtc = Number(record.priceTtc);
  if (!Number.isFinite(priceTtc) || priceTtc <= 0) return null;
  const sizesRaw = Array.isArray(record.sizes) ? record.sizes : [];
  const sizes = sizesRaw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => isProductSize(item));
  if (sizes.length === 0) return null;
  const createdAt =
    typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString();
  const updatedAt =
    typeof record.updatedAt === "string" ? record.updatedAt : createdAt;
  const sizeGuide = typeof record.sizeGuide === "string" ? record.sizeGuide.trim() : "";
  const draft = validateCatalogMakerTemplate(
    { label, category, priceTtc, sizes, sizeGuide },
    [],
  );
  if (!draft.ok) return null;
  const materialized = materializeCatalogMakerTemplate(draft.data, id, createdAt);
  return { ...materialized, updatedAt };
}

function normalizeMakerTemplates(raw: unknown): CatalogMakerTemplate[] {
  if (!Array.isArray(raw)) return [];
  const out: CatalogMakerTemplate[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const template = normalizeMakerTemplate(item);
    if (!template || seen.has(template.id)) continue;
    seen.add(template.id);
    out.push(template);
  }
  out.sort((a, b) => a.label.localeCompare(b.label, "fr"));
  return out;
}

function resolveStoreMakerTemplates(raw: AdminStore): CatalogMakerTemplate[] {
  return raw.version >= STORE_VERSION ? normalizeMakerTemplates(raw.makerTemplates) : [];
}

function coalesceStoreMakerTemplates(store: AdminStore): AdminStore {
  if (store.version < STORE_VERSION) return store;
  return { ...store, makerTemplates: normalizeMakerTemplates(store.makerTemplates) };
}

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
    [
      ...(Array.isArray(raw.removedCatalogIds) ? raw.removedCatalogIds : []),
      ...DEFAULT_REMOVED_CATALOG_IDS,
    ]
      .map((id) => String(id).trim())
      .filter(Boolean),
  );
  for (const id of RESTORED_CATALOG_SEED_IDS) removed.delete(id);
  const removedLookbookSlides = removedLookbookSlideIdSet(raw);

  const activeSeeds = SEEDED_PRODUCTS.filter((seed) => !removed.has(seed.id));

  const finalizeProducts = (items: AdminProduct[]) =>
    items.map(ensureProductDisplayFields);

  const priceFamilies = resolveStorePriceFamilies(raw);
  const makerTemplates = resolveStoreMakerTemplates(raw);

  if (raw.version === STORE_VERSION && existing.length > 0) {
    const mergedSeed = activeSeeds.map((seed) => mergeSeedProduct(seed, byId.get(seed.id)));
    const extras = existing.filter(
      (item) => !SEEDED_PRODUCTS.some((seed) => seed.id === item.id) && !removed.has(item.id),
    );
    const products = migrateProductVersoBackUrl([...mergedSeed, ...extras]);
    const catalogPersoBanner = normalizeCatalogPersoBannerRecord(raw.catalogPersoBanner);
    return {
      version: STORE_VERSION,
      products: finalizeProducts(products),
      orders: raw.orders,
      lookbook: mergeLookbookSlides(raw),
      priceFamilies,
      makerTemplates,
      ...(catalogPersoBanner ? { catalogPersoBanner } : {}),
      removedCatalogIds: [...removed],
      removedLookbookSlideIds: [...removedLookbookSlides],
    };
  }

  const mergedSeed = activeSeeds.map((seed) => mergeSeedProduct(seed, byId.get(seed.id)));
  const extras = existing.filter(
    (item) => !SEEDED_PRODUCTS.some((seed) => seed.id === item.id) && !removed.has(item.id),
  );
  const products = migrateProductVersoBackUrl([...mergedSeed, ...extras]);

  const catalogPersoBanner = normalizeCatalogPersoBannerRecord(raw.catalogPersoBanner);
  return {
    version: STORE_VERSION,
    products: finalizeProducts(products),
    orders: raw.orders,
    lookbook: mergeLookbookSlides(raw),
    priceFamilies,
    makerTemplates,
    ...(catalogPersoBanner ? { catalogPersoBanner } : {}),
    removedCatalogIds: [...removed],
    removedLookbookSlideIds: [...removedLookbookSlides],
  };
}

function normalizeStore(value: AdminStore): AdminStore {
  return migrateStore({
    version: typeof value.version === "number" ? value.version : 0,
    products: Array.isArray(value.products) ? value.products : [],
    orders: Array.isArray(value.orders) ? value.orders : [],
    lookbook: Array.isArray(value.lookbook) ? value.lookbook : [],
    removedCatalogIds: Array.isArray(value.removedCatalogIds) ? value.removedCatalogIds : [],
    removedLookbookSlideIds: Array.isArray(value.removedLookbookSlideIds)
      ? value.removedLookbookSlideIds
      : [],
    catalogPersoBanner: value.catalogPersoBanner,
  });
}

function mergeRemovedCatalogIds(
  storeRemoved: string[] | undefined,
  supabaseRemoved: string[],
): string[] {
  return [
    ...new Set([...(storeRemoved ?? []).map(String), ...supabaseRemoved.map(String)]),
  ].filter((id) => id.trim().length > 0);
}

async function overlaySupabaseProducts(store: AdminStore): Promise<AdminStore> {
  if (!isSupabaseStoreEnabled()) return store;
  try {
    const products = await listSupabaseProducts();
    const removed = await listRemovedCatalogIds();
    return {
      ...store,
      products,
      removedCatalogIds: mergeRemovedCatalogIds(store.removedCatalogIds, removed),
    };
  } catch (error) {
    console.error("[store] lecture Supabase produits", error instanceof Error ? error.message : "erreur");
    throw new StoreUnavailableError("Catalogue Supabase indisponible.");
  }
}

/** Lecture seule : aucune écriture Blob (catalogue, devis, findOrder). */
export async function loadStoreReadOnly(): Promise<AdminStore> {
  try {
    const snapshot = await readStoreSnapshot();
    if (snapshot === "missing") {
      if (isSupabaseStoreEnabled()) {
        const products = await listSupabaseProducts();
        const removed = await listRemovedCatalogIds();
        return {
          version: STORE_VERSION,
          products,
          orders: [],
          lookbook: [],
          removedCatalogIds: mergeRemovedCatalogIds(undefined, removed),
        };
      }
      if (!allowCatalogSeedFallback()) {
        throw new StoreUnavailableError();
      }
      console.warn("[store] snapshot absent, catalogue seed (preview/dev)");
      return overlaySupabaseProducts(normalizeStore(createSeededStore()));
    }
    return overlaySupabaseProducts(coalesceStoreMakerTemplates(snapshot.store));
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      if (!allowCatalogSeedFallback()) {
        throw error;
      }
      console.warn("[store] lecture seule indisponible, catalogue seed (preview/dev)");
      return normalizeStore(createSeededStore());
    }
    throw error;
  }
}

async function ensureInitialStore(): Promise<AdminStore> {
  const seeded = normalizeStore(createSeededStore());
  try {
    await writeStoreSnapshot(seeded, null, true);
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
      await enqueueStoreWrite(async () => {
        const fresh = await readStoreSnapshot();
        if (fresh === "missing") return;
        await writeStoreSnapshot(fresh.store, fresh.etag);
      });
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

type UploadedAdminImage = { imageUrl: string; blobUrl: string | null; blobPathname: string | null };

const IMAGE_STORAGE_UNAVAILABLE =
  "Stockage image indisponible : configurer R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL) ou utiliser npm run dev (fichiers locaux).";

async function uploadAdminImageFile(
  file: File,
  options: { supabaseFolder: string; blobPathPrefix: string; localFilePrefix: string },
): Promise<UploadedAdminImage> {
  const filename = `${safeFileName(file.name).replace(/\.[^.]+$/, "") || "image"}.webp`;

  if (isR2ImageStorageEnabled()) {
    try {
      const key = r2ObjectKey(`dingry/${options.supabaseFolder}`, filename);
      return await uploadR2PublicImage(key, file);
    } catch (error) {
      console.error("[store] upload R2", error instanceof Error ? error.message : "erreur");
      throw new StoreUnavailableError(
        error instanceof Error && error.message.length > 0
          ? `Upload image impossible (R2) : ${error.message}`
          : "Upload image impossible (Cloudflare R2).",
      );
    }
  }

  if (useLocalStoreFiles()) {
    await mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
    const localName = `${options.localFilePrefix}-${Date.now()}-${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(LOCAL_UPLOADS_DIR, localName), bytes);
    return {
      imageUrl: `/admin-uploads/${localName}`,
      blobUrl: null,
      blobPathname: null,
    };
  }

  throw new StoreUnavailableError(IMAGE_STORAGE_UNAVAILABLE);
}

export async function uploadProductImage(
  productId: string,
  file: File,
  face: ProductImageFace = "recto",
): Promise<UploadedAdminImage> {
  return uploadAdminImageFile(file, {
    supabaseFolder: `products/${productId}/${face}`,
    blobPathPrefix: `products/${productId}`,
    localFilePrefix: productId,
  });
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
  if (isR2PublicUrl(imageUrl) || isR2PublicUrl(blobUrl)) {
    await deleteR2PublicImage(imageUrl, blobPathname);
    return;
  }
  if (blobPathname && isR2ImageStorageEnabled() && !isVercelBlobUrl(blobUrl)) {
    await deleteR2PublicImage(imageUrl, blobPathname);
    return;
  }
  if (blobPathname && !blobPathname.startsWith("dingry/")) {
    await removePublicImage(blobPathname);
    return;
  }
  if (isVercelBlobUrl(blobUrl) || isVercelBlobUrl(imageUrl) || blobPathname?.startsWith("dingry/")) {
    console.warn("[store] média Vercel Blob héritage non supprimé (Blob retiré).");
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
  preuploadedRecto?: UploadedAdminImage;
  preuploadedVerso?: UploadedAdminImage;
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

  if (isSupabaseStoreEnabled()) {
    const products = await listSupabaseProducts();
    const publishedIds: string[] = [];
    const skipped: { id: string; reason: string }[] = [];
    for (const id of unique) {
      const product = products.find((item) => item.id === id);
      if (!product) {
        skipped.push({ id, reason: "Produit introuvable." });
        continue;
      }
      if (product.publishStatus === "live") continue;
      const verdict = assertPublishableProduct(product);
      if (!verdict.ok) {
        skipped.push({ id, reason: verdict.reason });
        continue;
      }
      product.publishStatus = "live";
      await upsertSupabaseProduct(product);
      publishedIds.push(id);
    }
    return { products: await listSupabaseProducts(), publishedIds, skipped };
  }

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

  if (isSupabaseStoreEnabled()) {
    const products = await listSupabaseProducts();
    const merged = reconcileDropBatchWithCatalog(products, items);
    if (!merged) return null;
    const orderedIds = [...merged]
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id))
      .map((item) => item.id);
    await reorderSupabaseProducts(orderedIds);
    const publishedIds: string[] = [];
    const skipped: { id: string; reason: string }[] = [];
    const refreshed = await listSupabaseProducts();
    for (const item of merged) {
      if (item.status !== "published") continue;
      const product = refreshed.find((row) => row.id === item.id);
      if (!product || product.publishStatus === "live") continue;
      const verdict = assertPublishableProduct(product);
      if (!verdict.ok) {
        skipped.push({ id: item.id, reason: verdict.reason });
        continue;
      }
      product.publishStatus = "live";
      await upsertSupabaseProduct(product);
      publishedIds.push(item.id);
    }
    return { products: await listSupabaseProducts(), publishedIds, skipped };
  }

  return withStoreOptimistic((store) => {
    const merged = reconcileDropBatchWithCatalog(store.products, items);
    if (!merged) {
      return { store, result: null, skipWrite: true };
    }

    const orderedIds = [...merged]
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id))
      .map((item) => item.id);

    store.products = applyDisplayOrderByIds(store.products, orderedIds);

    const publishedIds: string[] = [];
    const skipped: { id: string; reason: string }[] = [];

    for (const item of merged) {
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

  if (isSupabaseStoreEnabled()) {
    const products = await listSupabaseProducts();
    const known = new Set(products.map((item) => item.id));
    for (const id of orderedIds) {
      if (!known.has(id)) return null;
    }
    return reorderSupabaseProducts([...orderedIds]);
  }

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
  input: ProductInput & {
    file?: File | null;
    fileBack?: File | null;
    preuploadedRecto?: UploadedAdminImage | null;
    preuploadedVerso?: UploadedAdminImage | null;
  },
): Promise<AdminProduct> {
  let existingProducts: AdminProduct[];
  if (isSupabaseStoreEnabled()) {
    existingProducts = await listSupabaseProducts();
  } else {
    const snapshot = await readStoreSnapshot();
    existingProducts =
      snapshot === "missing" ? normalizeStore(createSeededStore()).products : snapshot.store.products;
  }
  const id = isSupabaseStoreEnabled()
    ? await nextSupabaseProductId(existingProducts)
    : nextProductId(existingProducts);
  let uploaded: Awaited<ReturnType<typeof uploadProductImage>>;
  if (input.file && input.file.size > 0) {
    uploaded = await uploadProductImage(id, input.file, "recto");
  } else if (input.preuploadedRecto?.imageUrl) {
    uploaded = input.preuploadedRecto;
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
  } else if (input.preuploadedVerso?.imageUrl) {
    uploadedBack = input.preuploadedVerso;
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

  if (isSupabaseStoreEnabled()) {
    const created = await upsertSupabaseProduct(product);
    const createdId = Number(created.id);
    if (Number.isInteger(createdId) && createdId > 0) {
      const seeded = await writeStockQuantity(createdId, created.stock);
      if (!seeded) await seedStockIfMissing(createdId, created.stock);
    }
    return created;
  }

  return withStoreOptimistic(
    (store) => {
      store.products = [product, ...store.products];
      return { store, result: product };
    },
    { adminRelaxedFinalize: true },
  ).then(async (created) => {
    const id = Number(created.id);
    if (Number.isInteger(id) && id > 0) {
      const seeded = await writeStockQuantity(id, created.stock);
      if (!seeded) await seedStockIfMissing(id, created.stock);
    }
    return created;
  });
}

function applyFieldsToProduct(
  product: AdminProduct,
  fields: Partial<ProductInput> & { clearImage?: boolean },
  uploadedRecto: Awaited<ReturnType<typeof uploadProductImage>> | undefined,
  uploadedVerso: Awaited<ReturnType<typeof uploadProductImage>> | undefined,
  clearImageBack: boolean,
): AdminProduct {
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
  if (fields.publishStatus) product.publishStatus = fields.publishStatus;
  if (fields.colorDeclinations !== undefined) product.colorDeclinations = fields.colorDeclinations;
  if (typeof fields.isPinned === "boolean") product.isPinned = fields.isPinned;
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
  return product;
}

async function findProductRecord(id: string): Promise<AdminProduct | undefined> {
  if (isSupabaseStoreEnabled()) {
    return (await getSupabaseProduct(id)) ?? undefined;
  }
  const snap = await readStoreSnapshot();
  if (snap === "missing") return undefined;
  return snap.store.products.find((item) => item.id === id);
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
        const current = await findProductRecord(id);
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
    const current = await findProductRecord(id);
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
    previousRecto = await findProductRecord(id);
    if (!previousRecto) return null;
    uploadedRecto = await uploadProductImage(id, rectoFile, "recto");
  } else if (fields.preuploadedRecto?.imageUrl) {
    previousRecto = await findProductRecord(id);
    if (!previousRecto) return null;
    uploadedRecto = fields.preuploadedRecto;
    delete fields.preuploadedRecto;
  }

  if (versoFile && versoFile.size > 0) {
    previousVerso = await findProductRecord(id);
    if (!previousVerso) return null;
    uploadedVerso = await uploadProductImage(id, versoFile, "verso");
  } else if (fields.preuploadedVerso?.imageUrl) {
    previousVerso = await findProductRecord(id);
    if (!previousVerso) return null;
    uploadedVerso = fields.preuploadedVerso;
    delete fields.preuploadedVerso;
  }

  if (clearImageBack) {
    previousForClearBack = await findProductRecord(id);
    if (!previousForClearBack) return null;
  }

  if (isSupabaseStoreEnabled()) {
    const current = await getSupabaseProduct(id);
    if (!current) return null;
    applyFieldsToProduct(current, fields, uploadedRecto, uploadedVerso, clearImageBack);
    const updated = await upsertSupabaseProduct(current);
    if (rectoFile && previousRecto) await deleteProductFaceMedia(previousRecto, "recto");
    if (versoFile && previousVerso) await deleteProductFaceMedia(previousVerso, "verso");
    if (clearImageBack && previousForClearBack?.imageBackUrl.trim()) {
      await deleteProductFaceMedia(previousForClearBack, "verso");
    }
    return updated;
  }

  return withStoreOptimistic((store) => {
    const product = store.products.find((item) => item.id === id);
    if (!product) {
      return { store, result: null, skipWrite: true };
    }

    applyFieldsToProduct(product, fields, uploadedRecto, uploadedVerso, clearImageBack);
    return { store, result: product };
  }, { adminRelaxedFinalize: true }).then(async (updated) => {
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

function isStaticCatalogId(id: string): boolean {
  return (
    SEEDED_PRODUCTS.some((seed) => seed.id === id) ||
    PRODUCTS.some((product) => String(product.id) === id)
  );
}

/** Masque un fantôme boutique (fallback) sans fiche CRM — tombstone uniquement. */
export async function maskStorefrontGhostProduct(id: string): Promise<{ ok: true } | { error: string }> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { error: "Identifiant produit invalide." };
  }

  const store = await loadStoreReadOnly();
  const online = buildStorefrontOnlineProducts(store);
  const row = online.find((product) => product.id === numericId);
  if (!row) {
    return { error: "Produit absent du catalogue en ligne." };
  }
  if (!row.ghost) {
    return { error: "Fiche CRM présente : supprimez ou passez en brouillon depuis le stock." };
  }
  if (!isStaticCatalogId(id)) {
    return { error: "Masquage réservé aux produits du catalogue statique." };
  }

  const tombstone = new Set<string>();
  tombstoneCatalogPair(tombstone, id);

  if (isSupabaseStoreEnabled()) {
    try {
      await addRemovedCatalogIds([...tombstone]);
    } catch (error) {
      console.error(
        "[store] tombstone Supabase",
        error instanceof Error ? error.message : "erreur",
      );
    }
  }

  const wrote = await withStoreOptimistic(
    (state) => {
      const next = new Set(state.removedCatalogIds ?? []);
      for (const entry of tombstone) next.add(entry);
      return { store: { ...state, removedCatalogIds: [...next] }, result: true, skipWrite: false };
    },
    { adminRelaxedFinalize: true },
  );
  if (!wrote) return { error: "Écriture magasin impossible." };
  return { ok: true };
}

export async function removeProduct(id: string): Promise<boolean> {
  if (isSupabaseStoreEnabled()) {
    const existing = await getSupabaseProduct(id);
    if (!existing) return false;
    const ok = await deleteSupabaseProduct(id);
    if (!ok) return false;
    if (isStaticCatalogId(id)) {
      const tombstone = new Set<string>();
      tombstoneCatalogPair(tombstone, id);
      await addRemovedCatalogIds([...tombstone]);
      for (const extra of tombstone) {
        if (extra !== id) await deleteSupabaseProduct(extra);
      }
    }
    await deleteProductImage(existing);
    return true;
  }

  const removed = await withStoreOptimistic(
    (store) => {
      const product = store.products.find((item) => item.id === id);
      if (!product) {
        return { store, result: null, skipWrite: true };
      }
      const copy = { ...product, sizes: [...product.sizes] };
      store.products = store.products.filter((item) => item.id !== id);
      if (isStaticCatalogId(id)) {
        const tombstone = new Set(store.removedCatalogIds ?? []);
        tombstoneCatalogPair(tombstone, id);
        store.removedCatalogIds = [...tombstone];
        store.products = store.products.filter((item) => !tombstone.has(item.id));
      }
      return { store, result: copy };
    },
    { adminRelaxedFinalize: true },
  );

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
    if (!current) {
      return { store, result: { order: null, changed: false }, skipWrite: true };
    }
    const patch = mutate(current);
    if (Object.keys(patch).length === 0) {
      return { store, result: { order: current, changed: false }, skipWrite: true };
    }
    if (!orderPatchHasChanges(current, patch)) {
      return { store, result: { order: current, changed: false }, skipWrite: true };
    }
    const nextOrder = { ...current, ...patch };
    store.orders[index] = nextOrder;
    return { store, result: { order: nextOrder, changed: true } };
  });
}

export async function uploadLookbookImage(slideId: string, file: File): Promise<UploadedAdminImage> {
  return uploadAdminImageFile(file, {
    supabaseFolder: `lookbook/${slideId}`,
    blobPathPrefix: `lookbook/${slideId}`,
    localFilePrefix: `lookbook-${slideId}`,
  });
}

async function deleteLookbookImage(slide: AdminLookbookSlide): Promise<void> {
  await deleteBlobOrLocal(slide.blobUrl, slide.blobPathname, slide.imageUrl);
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

const LOOKBOOK_STORE_WRITE_OPTIONS: StoreOptimisticOptions = { adminRelaxedFinalize: true };

export async function createLookbookSlide(
  input: LookbookInput & { file?: File; preuploadedImage?: UploadedAdminImage | null },
): Promise<AdminLookbookSlide> {
  const snapshot = await readStoreSnapshot();
  const base = snapshot === "missing" ? normalizeStore(createSeededStore()) : snapshot.store;
  const id = nextLookbookId(base.lookbook);
  let uploaded: UploadedAdminImage;
  if (input.file && input.file.size > 0) {
    uploaded = await uploadLookbookImage(id, input.file);
  } else if (input.preuploadedImage?.imageUrl) {
    uploaded = input.preuploadedImage;
  } else {
    throw new StoreUnavailableError("Une image est requise.");
  }
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

  return withStoreOptimistic(
    (store) => {
      store.lookbook = sortLookbook([...store.lookbook, slide]);
      return { store, result: slide };
    },
    LOOKBOOK_STORE_WRITE_OPTIONS,
  );
}

export async function updateLookbookSlide(
  id: string,
  input: Partial<LookbookInput> & { preuploadedImage?: UploadedAdminImage | null },
  file?: File,
): Promise<AdminLookbookSlide | null> {
  let uploaded: Awaited<ReturnType<typeof uploadLookbookImage>> | undefined;
  let previous: AdminLookbookSlide | undefined;

  if (file && file.size > 0) {
    uploaded = await uploadLookbookImage(id, file);
  } else if (input.preuploadedImage?.imageUrl) {
    uploaded = input.preuploadedImage;
  }
  const { preuploadedImage: _preuploaded, ...lookbookFields } = input;
  void _preuploaded;

  return withStoreOptimistic(
    (store) => {
      const index = store.lookbook.findIndex((item) => item.id === id);
      if (index < 0) {
        return { store, result: null, skipWrite: true };
      }
      const slide = store.lookbook[index];
      if (!slide) {
        return { store, result: null, skipWrite: true };
      }
      previous = { ...slide };
      const next: AdminLookbookSlide = {
        ...slide,
        ...(lookbookFields.title !== undefined ? { title: lookbookFields.title } : {}),
        ...(lookbookFields.caption !== undefined ? { caption: lookbookFields.caption } : {}),
        ...(lookbookFields.sortOrder !== undefined ? { sortOrder: lookbookFields.sortOrder } : {}),
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
    },
    LOOKBOOK_STORE_WRITE_OPTIONS,
  ).then(async (updated) => {
    if (uploaded && previous && updated) {
      await deleteLookbookImage(previous);
    }
    return updated;
  });
}

export async function removeLookbookSlide(id: string): Promise<boolean> {
  const removed = await withStoreOptimistic(
    (store) => {
      const slide = store.lookbook.find((item) => item.id === id);
      const tombstone = new Set(store.removedLookbookSlideIds ?? []);
      if (!slide) {
        if (tombstone.has(id)) {
          return { store, result: null, skipWrite: true };
        }
        const visibleOnStorefront = mergeLookbookSlides(store).some((item) => item.id === id);
        if (!visibleOnStorefront) {
          return { store, result: null, skipWrite: true };
        }
        tombstone.add(id);
        store.removedLookbookSlideIds = [...tombstone];
        return {
          store,
          result: {
            id,
            title: "",
            caption: "",
            imageUrl: "",
            blobUrl: null,
            blobPathname: null,
            sortOrder: 0,
            createdAt: "",
          },
        };
      }
      const copy = { ...slide };
      store.lookbook = store.lookbook.filter((item) => item.id !== id);
      tombstone.add(id);
      store.removedLookbookSlideIds = [...tombstone];
      return { store, result: copy };
    },
    LOOKBOOK_STORE_WRITE_OPTIONS,
  );

  if (!removed) return false;
  if (
    removed.imageUrl &&
    (removed.blobUrl || removed.blobPathname || removed.imageUrl.startsWith("/admin-uploads/"))
  ) {
    await deleteLookbookImage(removed);
  }
  return true;
}

export async function reorderLookbookSlide(id: string, direction: "up" | "down"): Promise<AdminLookbookSlide[] | null> {
  return withStoreOptimistic(
    (store) => {
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
      if (!current || !swap) {
        return { store, result: ordered, skipWrite: true };
      }
      store.lookbook = sortLookbook(
        store.lookbook.map((item) => {
          if (item.id === current.id) return { ...item, sortOrder: swap.sortOrder };
          if (item.id === swap.id) return { ...item, sortOrder: current.sortOrder };
          return item;
        }),
      );
      return { store, result: sortLookbook(store.lookbook) };
    },
    LOOKBOOK_STORE_WRITE_OPTIONS,
  );
}

const PERSO_BANNER_UPLOAD_ID = "perso";

export async function uploadCatalogPersoBannerImage(file: File): Promise<UploadedAdminImage> {
  return uploadAdminImageFile(file, {
    supabaseFolder: `banner/${PERSO_BANNER_UPLOAD_ID}`,
    blobPathPrefix: `banner/${PERSO_BANNER_UPLOAD_ID}`,
    localFilePrefix: `banner-${PERSO_BANNER_UPLOAD_ID}`,
  });
}

async function deleteCatalogPersoBannerImage(banner: AdminCatalogPersoBanner): Promise<void> {
  await deleteBlobOrLocal(banner.blobUrl, banner.blobPathname, banner.imageUrl);
}

export type CatalogPersoBannerInput = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
};

const PERSO_BANNER_STORE_WRITE_OPTIONS: StoreOptimisticOptions = { adminRelaxedFinalize: true };

export async function upsertCatalogPersoBanner(
  input: CatalogPersoBannerInput,
  file?: File,
  preuploadedImage?: UploadedAdminImage | null,
): Promise<AdminCatalogPersoBanner> {
  let uploaded: Awaited<ReturnType<typeof uploadCatalogPersoBannerImage>> | undefined;
  let previous: AdminCatalogPersoBanner | undefined;

  if (file && file.size > 0) {
    uploaded = await uploadCatalogPersoBannerImage(file);
  } else if (preuploadedImage?.imageUrl) {
    uploaded = preuploadedImage;
  }

  const result = await withStoreOptimistic(
    (store) => {
      previous = store.catalogPersoBanner ? { ...store.catalogPersoBanner } : undefined;
      const baseImage =
        uploaded?.imageUrl ??
        previous?.imageUrl?.trim() ??
        DEFAULT_CATALOG_PERSO_BANNER.imageUrl;
      const next: AdminCatalogPersoBanner = {
        enabled: input.enabled,
        imageUrl: baseImage,
        blobUrl: uploaded ? uploaded.blobUrl : (previous?.blobUrl ?? null),
        blobPathname: uploaded ? uploaded.blobPathname : (previous?.blobPathname ?? null),
        eyebrow: input.eyebrow,
        title: input.title,
        subtitle: input.subtitle,
        ctaLabel: input.ctaLabel,
        updatedAt: new Date().toISOString(),
      };
      store.catalogPersoBanner = next;
      return { store, result: next };
    },
    PERSO_BANNER_STORE_WRITE_OPTIONS,
  );

  if (uploaded && previous?.blobUrl) {
    const hadLocalOnly =
      previous.imageUrl.startsWith("/admin-uploads/") || previous.blobUrl || previous.blobPathname;
    if (hadLocalOnly && previous.imageUrl !== result.imageUrl) {
      await deleteCatalogPersoBannerImage(previous);
    }
  }

  return result;
}

export async function listPriceFamilies(): Promise<PriceFamily[]> {
  const store = await loadStoreReadOnly();
  return store.priceFamilies ?? [];
}

export function assertPriceFamilyAvailable(
  families: readonly PriceFamily[],
  draft: unknown,
): void {
  const validated = validatePriceFamilyDraft(draft, families);
  if (!validated.ok) {
    throw new PriceFamilyDuplicateError(validated.error);
  }
}

export async function registerPriceFamilyFromProduct(
  product: AdminProduct,
): Promise<PriceFamily> {
  const draft = priceFamilyDraftFromProductFields({
    name: product.name,
    category: product.category,
    variant: product.variant,
    price: product.price,
    sizes: product.sizes,
    sourceProductId: product.id,
  });
  return registerPriceFamily(draft);
}

export async function registerPriceFamily(draft: unknown): Promise<PriceFamily> {
  return withStoreOptimistic((store) => {
    const existing = store.priceFamilies ?? [];
    const validated = validatePriceFamilyDraft(draft, existing);
    if (!validated.ok) {
      throw new PriceFamilyDuplicateError(validated.error);
    }
    const now = new Date().toISOString();
    const family = materializePriceFamily(validated.data, validated.canonicalId, now);
    store.priceFamilies = [family, ...existing.filter((item) => item.canonicalId !== family.canonicalId)];
    return { store, result: family };
  });
}

export async function listMakerTemplates(): Promise<CatalogMakerTemplate[]> {
  const store = await loadStoreReadOnly();
  return normalizeMakerTemplates(store.makerTemplates);
}

export async function registerMakerTemplate(draft: unknown): Promise<CatalogMakerTemplate> {
  return withStoreOptimistic((store) => {
    const existing = normalizeMakerTemplates(store.makerTemplates);
    const validated = validateCatalogMakerTemplate(draft, existing);
    if (!validated.ok) {
      throw new CatalogMakerDuplicateError(validated.error);
    }
    const now = new Date().toISOString();
    const template = materializeCatalogMakerTemplate(validated.data, validated.id, now);
    store.makerTemplates = [
      template,
      ...existing.filter((item) => item.id !== template.id),
    ];
    return { store, result: template };
  });
}
