import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobNotFoundError, put } from "@vercel/blob";
import { isBlobConfigured } from "@/lib/admin/blob-config";
import { StoreConflictError, StoreUnavailableError } from "@/lib/admin/store-errors";
import type { AdminStore } from "@/lib/admin/types";
import { STORE_VERSION } from "@/lib/admin/types";

const STORE_BLOB_PATHNAME = "dingry/admin/store.json";

export type FileStoreSnapshot = {
  store: AdminStore;
  etag: string | null;
  migratedFromVersion?: number;
};

export function adminStoreSnapshotPath(): string {
  const fromEnv = (process.env.ADMIN_STORE_SNAPSHOT_PATH ?? "").trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "data", "admin", "store.json");
}

export function revisionFromDiskText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function isAdminStore(value: unknown): value is AdminStore {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.products) && Array.isArray(record.orders);
}

function normalizeStoreSnapshot(store: AdminStore): AdminStore {
  return { ...store, version: STORE_VERSION };
}

function snapshotFromText(text: string, etag: string | null): FileStoreSnapshot {
  const parsed: unknown = JSON.parse(text);
  if (!isAdminStore(parsed)) {
    throw new StoreUnavailableError();
  }
  const rawVersion = typeof parsed.version === "number" ? parsed.version : 0;
  const normalized = normalizeStoreSnapshot(parsed);
  return {
    store: normalized,
    etag,
    ...(rawVersion < STORE_VERSION ? { migratedFromVersion: rawVersion } : {}),
  };
}

async function fetchBlobStoreText(): Promise<{ text: string; etag: string } | "missing"> {
  const { list } = await import("@vercel/blob");
  const page = await list({ prefix: STORE_BLOB_PATHNAME, limit: 20 });
  const hit = page.blobs.find((item) => item.pathname === STORE_BLOB_PATHNAME);
  if (!hit) return "missing";
  const response = await fetch(hit.downloadUrl, { cache: "no-store" });
  if (!response.ok) throw new StoreUnavailableError();
  const text = await response.text();
  return { text, etag: revisionFromDiskText(text) };
}

async function readBlobStoreSnapshot(): Promise<FileStoreSnapshot | "missing"> {
  const payload = await fetchBlobStoreText();
  if (payload === "missing") return "missing";
  return snapshotFromText(payload.text, payload.etag);
}

async function writeBlobStoreSnapshot(
  store: AdminStore,
  etag: string | null,
  options?: { createIfAbsent?: boolean },
): Promise<void> {
  const next: AdminStore = { ...store, version: STORE_VERSION };
  const body = JSON.stringify(next, null, 2);
  const current = await fetchBlobStoreText();

  if (options?.createIfAbsent) {
    if (current !== "missing") throw new StoreConflictError();
  } else if (etag) {
    if (current === "missing") throw new StoreConflictError();
    if (current.etag !== etag) throw new StoreConflictError();
  }

  try {
    await put(STORE_BLOB_PATHNAME, body, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
  } catch (error) {
    if (error instanceof BlobNotFoundError) throw new StoreUnavailableError();
    if (error instanceof StoreConflictError) throw error;
    throw new StoreUnavailableError();
  }
}

export async function readFileStoreSnapshot(): Promise<FileStoreSnapshot | "missing"> {
  if (isBlobConfigured()) {
    try {
      return await readBlobStoreSnapshot();
    } catch (error) {
      if (error instanceof StoreUnavailableError) throw error;
      console.error("[store] lecture Blob", error instanceof Error ? error.name : "erreur");
      throw new StoreUnavailableError();
    }
  }

  const filePath = adminStoreSnapshotPath();
  try {
    const text = await readFile(filePath, "utf8");
    return snapshotFromText(text, revisionFromDiskText(text));
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ENOENT") return "missing";
    if (error instanceof StoreUnavailableError) throw error;
    throw new StoreUnavailableError();
  }
}

export async function writeFileStoreSnapshot(
  store: AdminStore,
  etag: string | null,
  options?: { createIfAbsent?: boolean },
): Promise<void> {
  if (isBlobConfigured()) {
    await writeBlobStoreSnapshot(store, etag, options);
    return;
  }

  const filePath = adminStoreSnapshotPath();
  const next: AdminStore = { ...store, version: STORE_VERSION };
  const body = JSON.stringify(next, null, 2);

  if (etag) {
    try {
      const current = await readFile(filePath, "utf8");
      if (revisionFromDiskText(current) !== etag) {
        throw new StoreConflictError();
      }
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "ENOENT") {
        if (!options?.createIfAbsent) throw new StoreConflictError();
      } else if (error instanceof StoreConflictError) {
        throw error;
      }
    }
  } else if (options?.createIfAbsent) {
    try {
      await readFile(filePath, "utf8");
      throw new StoreConflictError();
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "ENOENT") {
        if (error instanceof StoreConflictError) throw error;
        throw new StoreConflictError();
      }
    }
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, body, "utf8");
  await rename(temp, filePath);
}
