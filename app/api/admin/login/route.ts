import { NextResponse } from "next/server";
import { jsonNoStore } from "@/lib/http";
import { consumeBackupCode, ensureBackupCodes, isBackupCode } from "@/lib/admin/backup-codes";
import { createAdminSessionResponse } from "@/lib/admin/auth";
import {
  clearLoginFailures,
  clientAddress,
  loginClientAddressBlocked,
  loginRetryAfterSeconds,
  recordLoginFailure,
  retryAfterLabel,
} from "@/lib/admin/login-rate-limit";
import { sessionSecretFromEnv } from "@/lib/admin/session-token";
import { verifyAdminTotp, TotpMisconfiguredError, getTotpSecret } from "@/lib/admin/totp";

export const runtime = "nodejs";

const LOGIN_DENIED_MESSAGE = "Code incorrect ou expiré.";

function loginDenied() {
  return jsonNoStore({ error: LOGIN_DENIED_MESSAGE }, { status: 401 });
}

async function tooManyAttempts(address: string): Promise<NextResponse | null> {
  const retryAfter = await loginRetryAfterSeconds(address);
  if (retryAfter === "unavailable") {
    return jsonNoStore(
      { error: "Connexion indisponible (Redis). Vérifie UPSTASH_REDIS_* sur Vercel ou réessaie." },
      { status: 503 },
    );
  }
  if (retryAfter === 0) return null;
  return jsonNoStore(
    { error: `Trop de tentatives. Réessaie dans ${retryAfterLabel(retryAfter)}.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function POST(request: Request) {
  const address = clientAddress(request);
  if (loginClientAddressBlocked(address)) {
    return jsonNoStore(
      { error: "Connexion indisponible (adresse réseau non identifiée). Réessaie depuis dingry.com ou le lien Vercel du projet." },
      { status: 503 },
    );
  }
  const limited = await tooManyAttempts(address);
  if (limited) return limited;

  try {
    await getTotpSecret();
  } catch (error) {
    if (error instanceof TotpMisconfiguredError) {
      console.error("[admin-login] totp misconfigured");
      return jsonNoStore(
        { error: "Admin non configuré : ajoute ADMIN_TOTP_SECRET sur Vercel (même secret que Google Authenticator)." },
        { status: 503 },
      );
    }
    throw error;
  }

  if (!sessionSecretFromEnv()) {
    return jsonNoStore(
      {
        error:
          "Admin non configuré : définis ADMIN_TOTP_SECRET sur Vercel Production (même secret que Google Authenticator), puis redéploie.",
      },
      { status: 503 },
    );
  }

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    await recordLoginFailure(address);
    return loginDenied();
  }

  const compact = code.replace(/[\s-]/g, "").toUpperCase();
  let accepted = false;
  if (/^\d{6}$/.test(compact)) {
    accepted = await verifyAdminTotp(compact);
  } else if (isBackupCode(compact)) {
    accepted = await consumeBackupCode(compact);
  } else {
    await recordLoginFailure(address);
    return loginDenied();
  }

  if (!accepted) {
    await recordLoginFailure(address);
    return loginDenied();
  }

  await clearLoginFailures(address);
  const backupCodes = /^\d{6}$/.test(compact) ? await ensureBackupCodes() : null;
  return createAdminSessionResponse({
    ok: true,
    ...(backupCodes ? { backupCodes } : {}),
  });
}
