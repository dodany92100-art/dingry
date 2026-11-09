import { revalidateShopCatalog } from "@/lib/revalidate-shop-catalog";
import { requireAdmin } from "@/lib/admin/auth";
import { maskStorefrontGhostProduct, StoreUnavailableError } from "@/lib/admin/store";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: "Corps JSON attendu." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const id = record?.id;
  if (typeof id !== "string" && typeof id !== "number") {
    return jsonNoStore({ error: "Champ id requis." }, { status: 400 });
  }

  try {
    const result = await maskStorefrontGhostProduct(String(id).trim());
    if ("error" in result) {
      return jsonNoStore({ error: result.error }, { status: 400 });
    }
    revalidateShopCatalog();
    return jsonNoStore({ ok: true });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Magasin indisponible." }, { status: 503 });
    }
    console.error("[admin] catalog-mask", error instanceof Error ? error.message : "erreur");
    return jsonNoStore({ error: "Masquage impossible." }, { status: 500 });
  }
}
