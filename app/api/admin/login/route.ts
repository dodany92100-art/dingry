import { NextResponse } from "next/server";
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

function tooManyAttempts(address: string): NextResponse | null {
  const retryAfter = loginRetryAfterSeconds(address);
  if (retryAfter === 0) return null;
  return NextResponse.json(
    { error: `Trop de tentatives. Réessaie dans ${retryAfterLabel(retryAfter)}.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function POST(request: Request) {
  const address = clientAddress(request);
  const limited = tooManyAttempts(address);
  if (limited) return limited;

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    recordLoginFailure(address);
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const digits = code.replace(/\D/g, "");
  if (digits.length !== 6) {
    recordLoginFailure(address);
    return NextResponse.json(
      { error: "Entre le code à 6 chiffres de Google Authenticator." },
      { status: 400 },
    );
  }

  if (!(await verifyAdminTotp(digits))) {
    recordLoginFailure(address);
    return NextResponse.json({ error: "Code incorrect ou expiré." }, { status: 401 });
  }

  clearLoginFailures(address);
  return createAdminSessionResponse({ ok: true });
}
