import { NextResponse } from "next/server";
import { clientIp } from "@/lib/request-ip";
import { limitTeaserSignup, saveTeaserEmail } from "@/lib/teaser-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export async function POST(request: Request) {
  let email = "";
  let honeypot = "";
  try {
    const body = (await request.json()) as { email?: unknown; website?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    honeypot = typeof body.website === "string" ? body.website : "";
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (honeypot.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (email.length > 180 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Indiquez une adresse e-mail valide." }, { status: 400 });
  }

  const limited = await limitTeaserSignup(clientIp(request));
  if (!limited.ok) {
    const headers = limited.status === 429 && limited.retryAfter ? { "Retry-After": String(limited.retryAfter) } : undefined;
    return NextResponse.json({ error: limited.error }, { status: limited.status, headers });
  }

  const saved = await saveTeaserEmail(email);
  if (saved === "unavailable") {
    return NextResponse.json({ error: "Inscription indisponible." }, { status: 503 });
  }

  return NextResponse.json(
    { ok: true, already: saved === "duplicate" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
