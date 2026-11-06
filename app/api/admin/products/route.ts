import { revalidatePath } from "next/cache";
import { isBlobConfigured, requireAdmin } from "@/lib/admin/auth";
import { parseProductFields } from "@/lib/admin/parse-product";
import {
  createProduct,
  loadStoreReadOnly,
  StoreConflictError,
  StoreUnavailableError,
  ProductStockAdjustError,
  PublishValidationError,
  validateImageFile,
} from "@/lib/admin/store";
import { readStockQuantity } from "@/lib/stock";
import { normalizePublishStatus } from "@/lib/admin/types";
import type { ParsedProductFields } from "@/lib/admin/parse-product";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const store = await loadStoreReadOnly();
    const products = await Promise.all(
      store.products.map(async (product) => {
        const id = Number(product.id);
        if (!Number.isInteger(id) || id <= 0) return product;
        const live = await readStockQuantity(id);
        if (live === "missing" || live === "unavailable") return product;
        return { ...product, stock: live };
      }),
    );
    return jsonNoStore({
      products,
      blobEnabled: isBlobConfigured(),
    });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      console.error("Produits admin injoignables", error.name);
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    console.error("Produits admin", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Impossible de charger les produits." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonNoStore({ error: "Formulaire invalide." }, { status: 400 });
  }

  const parsed = parseProductFields(formData);
  if (parsed.error || !parsed.fields.sku || !parsed.fields.name || !parsed.fields.category || parsed.fields.price === undefined || parsed.fields.stock === undefined || !parsed.fields.sizes) {
    return jsonNoStore({ error: parsed.error || "Champs invalides." }, { status: 400 });
  }

  const image = formData.get("image");
  const imageBack = formData.get("imageBack");
  const publishStatus = normalizePublishStatus(String(formData.get("publishStatus") ?? "live"));
  const imageRequired = publishStatus === "live";
  if (imageRequired && (!(image instanceof File) || image.size === 0)) {
    return jsonNoStore({ error: "Une image est requise pour mettre en ligne." }, { status: 400 });
  }

  if (image instanceof File && image.size > 0) {
    const imageError = validateImageFile(image);
    if (imageError) {
      return jsonNoStore({ error: imageError }, { status: 400 });
    }
  }
  if (imageBack instanceof File && imageBack.size > 0) {
    const err = validateImageFile(imageBack);
    if (err) {
      return jsonNoStore({ error: err }, { status: 400 });
    }
  }

  const fields = parsed.fields as ParsedProductFields;

  try {
    const product = await createProduct({
      sku: fields.sku,
      name: fields.name,
      variant: fields.variant ?? "",
      description: fields.description ?? "",
      fabrication: fields.fabrication ?? "",
      limitedEdition: fields.limitedEdition ?? "",
      materials: fields.materials ?? "",
      sizeGuide: fields.sizeGuide ?? "",
      printPlacement: fields.printPlacement,
      category: fields.category,
      price: fields.price,
      sizes: fields.sizes,
      stock: fields.stock,
      publishStatus: fields.publishStatus ?? publishStatus,
      file: image instanceof File && image.size > 0 ? image : null,
      fileBack: imageBack instanceof File && imageBack.size > 0 ? imageBack : null,
    });
    revalidatePath("/api/catalog");
    revalidatePath("/");
    return jsonNoStore({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      console.error("Création produit indisponible", error.name);
      return jsonNoStore({ error: error.message || "Enregistrement indisponible." }, { status: 503 });
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
    console.error("Création produit", error instanceof Error ? error.stack : error);
    const hint =
      error instanceof Error && error.message.length > 0 && error.message.length < 160
        ? error.message
        : "Impossible d'enregistrer le produit.";
    return jsonNoStore({ error: hint }, { status: 500 });
  }
}
