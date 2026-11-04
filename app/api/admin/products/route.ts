import { isBlobConfigured, requireAdmin } from "@/lib/admin/auth";
import { parseProductFields } from "@/lib/admin/parse-product";
import {
  createProduct,
  loadStoreReadOnly,
  StoreConflictError,
  StoreUnavailableError,
  ProductStockAdjustError,
  validateImageFile,
} from "@/lib/admin/store";
import { readStockQuantity } from "@/lib/stock";
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
  if (!(image instanceof File) || image.size === 0) {
    return jsonNoStore({ error: "Une image est requise." }, { status: 400 });
  }

  const imageError = validateImageFile(image);
  if (imageError) {
    return jsonNoStore({ error: imageError }, { status: 400 });
  }

  const fields = parsed.fields as ParsedProductFields;

  try {
    const product = await createProduct({
      sku: fields.sku,
      name: fields.name,
      variant: fields.variant ?? "",
      description: fields.description ?? "",
      category: fields.category,
      price: fields.price,
      sizes: fields.sizes,
      stock: fields.stock,
      file: image,
    });
    return jsonNoStore({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      console.error("Création produit indisponible", error.name);
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    if (error instanceof ProductStockAdjustError) {
      const status = error.code === "negative" ? 409 : 503;
      return jsonNoStore({ error: error.message }, { status });
    }
    console.error("Création produit", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Impossible d'enregistrer le produit." }, { status: 500 });
  }
}
