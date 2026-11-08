import { createHash, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSharedRedis } from "@/lib/ratelimit";
import { getTotpSecret } from "@/lib/admin/totp";
import { StoreConflictError } from "@/lib/admin/store-errors";

const CODE_COUNT = 8;
const CODE_LENGTH = 10;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LOCAL_PATH = path.join(process.cwd(), "data", "admin", "backup-codes.json");
const REDIS_KEY = "dingry:admin:backup-codes:v1";
const INIT_KEY = "dingry:admin-backup:init";
const WRITE_ATTEMPTS = 5;

type BackupFile = { hashes: string[] };

type CodesSnapshot = {
  file: BackupFile;
  etag: string | null;
};

export type BackupCodesStoreState = "missing" | "error" | "exhausted" | "initialized";

function revisionFromDiskText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function backupCodesPath(): string {
  return (process.env.ADMIN_BACKUP_CODES_PATH ?? "").trim() || LOCAL_PATH;
}

function randomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let raw = "";
  for (const byte of bytes) raw += ALPHABET[byte % ALPHABET.length];
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

export function normalizeBackupCode(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function isBackupCode(value: string): boolean {
  return new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`).test(normalizeBackupCode(value));
}

export function backupCodesStoreState(snapshot: CodesSnapshot | "missing" | "error"): BackupCodesStoreState {
  if (snapshot === "missing") return "missing";
  if (snapshot === "error") return "error";
  if (snapshot.file.hashes.length === 0) return "exhausted";
  return "initialized";
}

export function shouldIssueNewBackupCodes(state: BackupCodesStoreState): boolean {
  return state === "missing";
}

async function hashCode(code: string): Promise<string> {
  const secret = await getTotpSecret();
  return createHash("sha256").update(`${secret}:${normalizeBackupCode(code)}`).digest("hex");
}

function hashesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const hashes = (value as { hashes?: unknown }).hashes;
  return Array.isArray(hashes) && hashes.every((item) => typeof item === "string" && /^[a-f0-9]{64}$/.test(item));
}

async function readCodesFromRedis(): Promise<CodesSnapshot | "missing" | "error" | null> {
  const client = getSharedRedis();
  if (!client) return null;
  try {
    const raw = await client.get(REDIS_KEY);
    if (raw == null || raw === "") return "missing";
    const text = typeof raw === "string" ? raw : String(raw);
    const parsed: unknown = JSON.parse(text);
    if (!isBackupFile(parsed)) return "error";
    return { file: parsed, etag: revisionFromDiskText(text) };
  } catch (error) {
    console.error("Codes de secours Redis illisibles", error instanceof Error ? error.name : "erreur");
    return "error";
  }
}

async function writeCodesToRedis(file: BackupFile, etag: string | null): Promise<boolean> {
  const client = getSharedRedis();
  if (!client) return false;
  const body = JSON.stringify(file);
  if (etag) {
    const currentRaw = await client.get(REDIS_KEY);
    const current =
      currentRaw == null || currentRaw === ""
        ? ""
        : typeof currentRaw === "string"
          ? currentRaw
          : String(currentRaw);
    if (current && revisionFromDiskText(current) !== etag) {
      throw new BackupCodesConflictError();
    }
  }
  await client.set(REDIS_KEY, body);
  return true;
}

async function readCodesSnapshot(): Promise<CodesSnapshot | "missing" | "error"> {
  const fromRedis = await readCodesFromRedis();
  if (fromRedis !== null) return fromRedis;

  const filePath = backupCodesPath();
  try {
    const text = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(text);
    if (!isBackupFile(parsed)) return "error";
    return { file: parsed, etag: revisionFromDiskText(text) };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ENOENT") return "missing";
    console.error("Codes de secours illisibles", error instanceof Error ? error.name : "erreur");
    return "error";
  }
}

async function writeCodesSnapshot(file: BackupFile, etag: string | null): Promise<void> {
  const body = JSON.stringify(file);
  const wroteRedis = await writeCodesToRedis(file, etag);
  if (wroteRedis) return;

  const filePath = backupCodesPath();
  if (etag) {
    try {
      const current = await readFile(filePath, "utf8");
      if (revisionFromDiskText(current) !== etag) {
        throw new BackupCodesConflictError();
      }
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "ENOENT") throw new BackupCodesConflictError();
      if (error instanceof BackupCodesConflictError) throw error;
    }
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body, "utf8");
}

export class BackupCodesConflictError extends Error {
  constructor() {
    super("backup-codes-conflict");
    this.name = "BackupCodesConflictError";
  }
}

/** Seules les erreurs de concurrence optimiste déclenchent un retry. */
export function isBackupCodesWriteConflict(error: unknown): boolean {
  return error instanceof BackupCodesConflictError || error instanceof StoreConflictError;
}

async function claimGeneration(): Promise<"claimed" | "duplicate" | "skip"> {
  const client = getSharedRedis();
  if (!client) return "skip";
  try {
    const result = await client.set(INIT_KEY, "1", { nx: true, ex: 60 });
    return result === "OK" ? "claimed" : "duplicate";
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.name : "erreur");
    return "skip";
  }
}

async function releaseGeneration(): Promise<void> {
  const client = getSharedRedis();
  if (!client) return;
  try {
    await client.del(INIT_KEY);
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.name : "erreur");
  }
}

/** Retourne les codes en clair une seule fois, à la création initiale uniquement. */
export async function ensureBackupCodes(): Promise<string[] | null> {
  const snapshot = await readCodesSnapshot();
  const state = backupCodesStoreState(snapshot);
  if (!shouldIssueNewBackupCodes(state)) return null;

  const claim = await claimGeneration();
  if (claim === "duplicate") return null;

  const plain = Array.from({ length: CODE_COUNT }, () => randomCode());
  try {
    const hashes = await Promise.all(plain.map((code) => hashCode(code)));
    await writeCodesSnapshot({ hashes }, null);
    return plain;
  } catch (error) {
    await releaseGeneration();
    console.error("Codes de secours non enregistrés", error instanceof Error ? error.name : "erreur");
    return null;
  }
}

export async function consumeBackupCode(code: string): Promise<boolean> {
  if (!isBackupCode(code)) return false;
  const digest = await hashCode(code);

  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
    const snapshot = await readCodesSnapshot();
    if (snapshot === "missing" || snapshot === "error") return false;
    const index = snapshot.file.hashes.findIndex((hash) => hashesMatch(hash, digest));
    if (index < 0) return false;

    const client = getSharedRedis();
    if (client) {
      try {
        const claimed = await client.set(`dingry:admin-backup:${digest}`, "1", { nx: true });
        if (claimed !== "OK") return false;
      } catch (error) {
        console.error("Upstash injoignable", error instanceof Error ? error.name : "erreur");
        if (process.env.NODE_ENV === "production") return false;
      }
    }

    const next: BackupFile = {
      hashes: snapshot.file.hashes.filter((_, position) => position !== index),
    };

    try {
      await writeCodesSnapshot(next, snapshot.etag);
      return true;
    } catch (error) {
      if (isBackupCodesWriteConflict(error)) continue;
      console.error("Codes de secours non enregistrés", error instanceof Error ? error.name : "erreur");
      return false;
    }
  }

  return false;
}
