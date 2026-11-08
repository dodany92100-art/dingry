import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdminStore } from "@/lib/admin/types";
import { STORE_VERSION } from "@/lib/admin/types";
import { StoreConflictError, StoreUnavailableError } from "@/lib/admin/store-errors";

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

export async function readFileStoreSnapshot(): Promise<FileStoreSnapshot | "missing"> {
  const filePath = adminStoreSnapshotPath();
  try {
    const text = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(text);
    if (!isAdminStore(parsed)) {
      throw new StoreUnavailableError();
    }
    const rawVersion = typeof (parsed as AdminStore).version === "number" ? (parsed as AdminStore).version : 0;
    const normalized = normalizeStoreSnapshot(parsed);
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

export async function writeFileStoreSnapshot(
  store: AdminStore,
  etag: string | null,
  options?: { createIfAbsent?: boolean },
): Promise<void> {
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
