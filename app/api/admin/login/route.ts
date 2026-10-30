import { NextResponse } from "next/server";
import { consumeBackupCode, ensureBackupCodes, isBackupCode } from "@/lib/admin/backup-codes";
import { createAdminSessionResponse } from "@/lib/admin/auth";
import {
  clearLoginFailures,
  clientAddress,
  loginRetryAfterSeconds,
  recordLoginFailure,
  retryAfterLabel,
} from "@/lib/admin/login-rate-limit";
import { verifyAdminTotp } from "@/lib/admin/totp";

export const runtime = "nodejs";

async function tooManyAttempts(address: string): Promise<NextResponse | null> {
  const retryAfter = await loginRetryAfterSeconds(address);
  if (retryAfter === "unavailable") {
    return NextResponse.json({ error: "Connexion indisponible." }, { status: 503 });
  }
  if (retryAfter === 0) return null;
  return NextResponse.json(
    { error: `Trop de tentatives. Réessaie dans ${retryAfterLabel(retryAfter)}.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function POST(request: Request) {
  const address = clientAddress(request);
  const limited = await tooManyAttempts(address);
  if (limited) return limited;

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    await recordLoginFailure(address);
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const compact = code.replace(/[\s-]/g, "").toUpperCase();
  let accepted = false;
  if (/^\d{6}$/.test(compact)) {
    accepted = await verifyAdminTotp(compact);
  } else if (isBackupCode(compact)) {
    accepted = await consumeBackupCode(compact);
  } else {
    await recordLoginFailure(address);
    return NextResponse.json(
      { error: "Entre le code à 6 chiffres ou un code de secours." },
      { status: 400 },
    );
  }

  if (!accepted) {
    await recordLoginFailure(address);
    return NextResponse.json({ error: "Code incorrect ou expiré." }, { status: 401 });
  }

  await clearLoginFailures(address);
  const backupCodes = /^\d{6}$/.test(compact) ? await ensureBackupCodes() : null;
  return createAdminSessionResponse({
    ok: true,
    ...(backupCodes ? { backupCodes } : {}),
  });
}
