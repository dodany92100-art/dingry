import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { isRequestCrmHost } from "@/lib/admin/crm-host-request";
import { isPreviewFeatureEnabled } from "@/lib/preview-cookie";
import { setPreviewCookieOnResponse } from "@/lib/preview-cookie-http";
import { shopWebsitedxUrl } from "@/lib/shop-preview-url";

export const runtime = "nodejs";

export async function POST() {
  if (!isPreviewFeatureEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  if (!(await isRequestCrmHost())) {
    return new NextResponse(null, { status: 404 });
  }
  const denied = await requireAdmin();
  if (denied) return denied;

  return setPreviewCookieOnResponse({
    ok: true,
    openUrl: shopWebsitedxUrl(),
  });
}