import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  PREVIEW_COOKIE_NAME,
  isPreviewFeatureEnabled,
  previewSecretFromEnv,
  verifyPreviewCookie,
} from "@/lib/preview-cookie";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

/** Indique si la barre Alto peut s’afficher sur la vitrine (session admin ou cookie preview). */
export async function GET() {
  const authenticated = await isAdminAuthenticated();
  let preview = false;
  if (isPreviewFeatureEnabled()) {
    const secret = previewSecretFromEnv();
    if (secret) {
      const store = await cookies();
      const token = store.get(PREVIEW_COOKIE_NAME)?.value ?? "";
      preview = await verifyPreviewCookie(token, secret);
    }
  }
  const showAlto = authenticated || preview;
  if (!showAlto) {
    return NextResponse.json({ showAlto: false }, { status: 401 });
  }
  return jsonNoStore({ showAlto: true, preview, authenticated });
}