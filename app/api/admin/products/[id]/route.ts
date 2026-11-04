import { requireAdmin } from "@/lib/admin/auth";
import { parseProductFields } from "@/lib/admin/parse-product";
import {
  loadStoreReadOnly,
  removeProduct,
  updateProduct,
  validateImageFile,
  StoreConflictError,
  StoreUnavailableError,
  ProductStockAdjustError,
} from "@/lib/admin/store";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  if (!id) {
    return jsonNoStore({ error: "Produit introuvable." }, { status: 404 });
  }

  try {
    const store = await loadStoreReadOnly();
    const current = store.products.find((item) => item.id === id);
    if (!current) {
      return jsonNoStore({ error: "Produit introuvable." }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const parsed = parseProductFields(formData, { partial: true });
      if (parsed.error) {
        return jsonNoStore({ error: parsed.error }, { status: 400 });
      }

      const image = formData.get("image");
      let file: File | undefined;
      if (image instanceof File && image.size > 0) {
        const imageError = validateImageFile(image);
        if (imageError) {
          return jsonNoStore({ error: imageError }, { status: 400 });
        }
        file = image;
      }

      const product = await updateProduct(id, parsed.fields, file);
      return jsonNoStore({ product });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonNoStore({ error: "Corps JSON invalide." }, { status: 400 });
    }

    if (typeof body.stockDelta === "number") {
      const product = await updateProduct(id, { stockDelta: body.stockDelta });
      return jsonNoStore({ product });
    }

    const parsed = parseProductFields(body, { partial: true });
    if (parsed.error) {
      return jsonNoStore({ error: parsed.error }, { status: 400 });
    }
    const product = await updateProduct(id, parsed.fields);
    return jsonNoStore({ product });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      console.error("Mise à jour produit indisponible", error.name);
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    if (error instanceof ProductStockAdjustError) {
      const status = error.code === "negative" ? 409 : 503;
      return jsonNoStore({ error: error.message }, { status });
    }
    console.error("Mise à jour produit", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Impossible de mettre à jour le produit." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const removed = await removeProduct(id);
    if (!removed) {
      return jsonNoStore({ error: "Produit introuvable." }, { status: 404 });
    }
    return jsonNoStore({ ok: true });
  } catch (error) {
    console.error("Suppression produit", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Impossible de supprimer le produit." }, { status: 500 });
  }
}
