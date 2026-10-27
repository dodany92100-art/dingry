import { NextResponse } from "next/server";
import { createAdminSessionResponse } from "@/lib/admin/auth";
import { verifyAdminTotp } from "@/lib/admin/totp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const digits = code.replace(/\D/g, "");
  if (digits.length !== 6) {
    return NextResponse.json(
      { error: "Entre le code à 6 chiffres de Google Authenticator." },
      { status: 400 },
    );
  }

  if (!(await verifyAdminTotp(digits))) {
    return NextResponse.json({ error: "Code incorrect ou expiré." }, { status: 401 });
  }

  return createAdminSessionResponse({ ok: true });
}
