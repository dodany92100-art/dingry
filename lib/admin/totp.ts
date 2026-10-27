import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";

const LOCAL_SECRET_PATH = path.join(process.cwd(), "data", "admin", "totp-secret.txt");

function normalizeSecret(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

async function readDiskSecret(): Promise<string> {
  try {
    const existing = (await readFile(LOCAL_SECRET_PATH, "utf8")).trim();
    return existing ? normalizeSecret(existing) : "";
  } catch {
    return "";
  }
}

async function writeDiskSecret(secret: string): Promise<void> {
  await mkdir(path.dirname(LOCAL_SECRET_PATH), { recursive: true });
  await writeFile(LOCAL_SECRET_PATH, secret, "utf8");
}

export async function getTotpSecret(): Promise<string> {
  const fromEnv = process.env.ADMIN_TOTP_SECRET?.trim();
  if (fromEnv) return normalizeSecret(fromEnv);

  const fromDisk = await readDiskSecret();
  if (fromDisk) return fromDisk;

  const generated = new Secret({ size: 20 }).base32;
  try {
    await writeDiskSecret(generated);
  } catch {
    // En prod (Vercel) le disque est souvent en lecture seule : définir ADMIN_TOTP_SECRET.
  }
  return generated;
}

export function createAdminTotp(secret: string): TOTP {
  return new TOTP({
    issuer: "DINGRY",
    label: "Admin",
    issuerInLabel: true,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}

export async function getAdminTotp(): Promise<TOTP> {
  return createAdminTotp(await getTotpSecret());
}

export async function verifyAdminTotp(code: string): Promise<boolean> {
  const token = code.replace(/\D/g, "");
  if (token.length !== 6) return false;
  const totp = await getAdminTotp();
  return totp.validate({ token, window: 2 }) !== null;
}

function toGoogleAuthenticatorUri(secret: string): string {
  return `otpauth://totp/DINGRY:Admin?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent("DINGRY")}`;
}

/** QR d’enrôlement uniquement en local — jamais en production (évite d’exposer le secret). */
export function isTotpEnrollmentPublic(): boolean {
  return process.env.NODE_ENV !== "production";
}

export async function getTotpEnrollmentQr(): Promise<string> {
  const secret = await getTotpSecret();
  return QRCode.toDataURL(toGoogleAuthenticatorUri(secret), {
    margin: 2,
    width: 280,
    errorCorrectionLevel: "M",
    color: { dark: "#050505", light: "#ffffff" },
  });
}
