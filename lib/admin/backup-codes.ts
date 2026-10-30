import { createHash, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { getSharedRedis } from "@/lib/ratelimit";
import { getTotpSecret } from "@/lib/admin/totp";

const CODE_COUNT = 8;
const CODE_LENGTH = 10;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LOCAL_PATH = path.join(process.cwd(), "data", "admin", "backup-codes.json");
const BLOB_PATH = "dingry/admin/backup-codes.json";
const INIT_KEY = "dingry:admin-backup:init";

type BackupFile = { hashes: string[] };

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
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

async function readCodes(): Promise<BackupFile | "missing" | "error"> {
  if (blobConfigured()) {
    try {
      const result = await get(BLOB_PATH, { access: "private", useCache: false });
      if (!result || result.statusCode !== 200 || !result.stream) return "missing";
      const parsed: unknown = JSON.parse(await new Response(result.stream).text());
      return isBackupFile(parsed) ? parsed : "error";
    } catch (error) {
      const missing = error instanceof Error && /not found|404/i.test(error.message);
      if (missing) return "missing";
      console.error("Codes de secours illisibles", error instanceof Error ? error.message : "erreur");
      return "error";
    }
  }

  try {
    const parsed: unknown = JSON.parse(await readFile(LOCAL_PATH, "utf8"));
    return isBackupFile(parsed) ? parsed : "error";
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ENOENT") return "missing";
    console.error("Codes de secours illisibles", error instanceof Error ? error.message : "erreur");
    return "error";
  }
}

async function writeCodes(file: BackupFile): Promise<void> {
  const body = JSON.stringify(file);
  if (blobConfigured()) {
    await put(BLOB_PATH, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
    return;
  }
  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await writeFile(LOCAL_PATH, body, "utf8");
}

async function claimGeneration(): Promise<"claimed" | "duplicate" | "skip"> {
  const client = getSharedRedis();
  if (!client) return "skip";
  try {
    const result = await client.set(INIT_KEY, "1", { nx: true, ex: 60 });
    return result === "OK" ? "claimed" : "duplicate";
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
    return "skip";
  }
}

async function releaseGeneration(): Promise<void> {
  const client = getSharedRedis();
  if (!client) return;
  try {
    await client.del(INIT_KEY);
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
  }
}

/** Retourne les codes en clair une seule fois, à la création. */
export async function ensureBackupCodes(): Promise<string[] | null> {
  const existing = await readCodes();
  if (existing === "error" || (existing !== "missing" && existing.hashes.length > 0)) return null;

  const claim = await claimGeneration();
  if (claim === "duplicate") return null;

  const plain = Array.from({ length: CODE_COUNT }, () => randomCode());
  try {
    const hashes = await Promise.all(plain.map((code) => hashCode(code)));
    await writeCodes({ hashes });
    return plain;
  } catch (error) {
    await releaseGeneration();
    console.error("Codes de secours non enregistrés", error instanceof Error ? error.message : "erreur");
    return null;
  }
}

export async function consumeBackupCode(code: string): Promise<boolean> {
  if (!isBackupCode(code)) return false;
  const digest = await hashCode(code);
  const file = await readCodes();
  if (file === "missing" || file === "error") return false;
  const index = file.hashes.findIndex((hash) => hashesMatch(hash, digest));
  if (index < 0) return false;

  const client = getSharedRedis();
  if (client) {
    try {
      const claimed = await client.set(`dingry:admin-backup:${digest}`, "1", { nx: true });
      if (claimed !== "OK") return false;
    } catch (error) {
      console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
      if (process.env.NODE_ENV === "production") return false;
    }
  }

  file.hashes.splice(index, 1);
  await writeCodes(file);
  return true;
}
