import { NextResponse } from "next/server";
import { getTotpEnrollmentQr, isTotpEnrollmentPublic } from "@/lib/admin/totp";

export const runtime = "nodejs";

export async function GET() {
  if (!isTotpEnrollmentPublic()) {
    return NextResponse.json(
      { showEnrollment: false },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const qrDataUrl = await getTotpEnrollmentQr();
    return NextResponse.json(
      { showEnrollment: true, qrDataUrl },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de générer le QR Google Authenticator." },
      { status: 500 },
    );
  }
}
