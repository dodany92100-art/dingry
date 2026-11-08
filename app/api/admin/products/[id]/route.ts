import { revalidateShopCatalog } from "@/lib/revalidate-shop-catalog";
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
  PublishValidationError,
} from "@/lib/admin/store";
import { isDraftPlaceholderImage } from "@/lib/admin/types";
import { preuploadedRectoFromForm, preuploadedVersoFromForm } from "@/lib/admin/preuploaded-image";
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
      const imageBack = formData.get("imageBack");
      const preuploadedRecto = preuploadedRectoFromForm(formData);
      const preuploadedVerso = preuploadedVersoFromForm(formData);
      let file: File | undefined;
      if (image instanceof File && image.size > 0) {
        const imageError = validateImageFile(image);
        if (imageError) {
          return jsonNoStore({ error: imageError }, { status: 400 });
        }
        file = image;
      }
      let fileBack: File | undefined;
      if (imageBack instanceof File && imageBack.size > 0) {
        const err = validateImageFile(imageBack);
        if (err) {
          return jsonNoStore({ error: err }, { status: 400 });
        }
        fileBack = imageBack;
      }

      const nextPublish =
        parsed.fields.publishStatus ?? current.publishStatus ?? "live";
      if (
        nextPublish === "live" &&
        !file &&
        !preuploadedRecto &&
        isDraftPlaceholderImage(current.imageUrl)
      ) {
        return jsonNoStore(
          { error: "Ajoute une image WebP pour mettre en ligne." },
          { status: 400 },
        );
      }

      const clearImage = formData.get("clearImage") === "1";
      const clearImageBack = formData.get("clearImageBack") === "1";
      const product = await updateProduct(
        id,
        {
          ...parsed.fields,
          ...(clearImage ? { clearImage: true } : {}),
          ...(clearImageBack ? { clearImageBack: true } : {}),
          ...(fileBack ? { versoFile: fileBack } : {}),
          ...(preuploadedRecto ? { preuploadedRecto } : {}),
          ...(preuploadedVerso ? { preuploadedVerso } : {}),
        },
        file,
      );
      revalidateShopCatalog();
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
      revalidateShopCatalog();
      return jsonNoStore({ product });
    }

    if (typeof body.isPinned === "boolean") {
      const product = await updateProduct(id, { isPinned: body.isPinned });
      revalidateShopCatalog();
      return jsonNoStore({ product });
    }

    const parsed = parseProductFields(body, { partial: true });
    if (parsed.error) {
      return jsonNoStore({ error: parsed.error }, { status: 400 });
    }
    const product = await updateProduct(id, parsed.fields);
    revalidateShopCatalog();
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
    if (error instanceof PublishValidationError) {
      return jsonNoStore({ error: error.message }, { status: 400 });
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
    revalidateShopCatalog();
    return jsonNoStore({ ok: true });
  } catch (error) {
    console.error("Suppression produit", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Impossible de supprimer le produit." }, { status: 500 });
  }
}
