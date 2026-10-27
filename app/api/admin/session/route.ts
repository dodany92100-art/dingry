import { NextResponse } from "next/server";
import { isAdminAuthenticated, isBlobConfigured } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    blobEnabled: isBlobConfigured(),
  });
}
