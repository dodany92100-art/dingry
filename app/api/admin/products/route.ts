import { NextResponse } from "next/server";
import { isBlobConfigured, requireAdmin } from "@/lib/admin/auth";
import { parseProductFields } from "@/lib/admin/parse-product";
import { createProduct, loadStore, validateImageFile } from "@/lib/admin/store";
import type { ParsedProductFields } from "@/lib/admin/parse-product";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const store = await loadStore();
    return NextResponse.json({
      products: store.products,
      blobEnabled: isBlobConfigured(),
    });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les produits." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  }

  const parsed = parseProductFields(formData);
  if (parsed.error || !parsed.fields.sku || !parsed.fields.name || !parsed.fields.category || parsed.fields.price === undefined || parsed.fields.stock === undefined || !parsed.fields.sizes) {
    return NextResponse.json({ error: parsed.error || "Champs invalides." }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Une image est requise." }, { status: 400 });
  }

  const imageError = validateImageFile(image);
  if (imageError) {
    return NextResponse.json({ error: imageError }, { status: 400 });
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
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer le produit. Vérifie BLOB_READ_WRITE_TOKEN." },
      { status: 500 },
    );
  }
}
