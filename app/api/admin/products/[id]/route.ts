import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { parseProductFields } from "@/lib/admin/parse-product";
import { loadStore, removeProduct, updateProduct, validateImageFile } from "@/lib/admin/store";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  const store = await loadStore();
  const current = store.products.find((item) => item.id === id);
  if (!current) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const parsed = parseProductFields(formData, { partial: true });
      if (parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const image = formData.get("image");
      let file: File | undefined;
      if (image instanceof File && image.size > 0) {
        const imageError = validateImageFile(image);
        if (imageError) {
          return NextResponse.json({ error: imageError }, { status: 400 });
        }
        file = image;
      }

      const product = await updateProduct(id, parsed.fields, file);
      return NextResponse.json({ product });
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.stockDelta === "number") {
      const product = await updateProduct(id, { stockDelta: body.stockDelta });
      return NextResponse.json({ product });
    }

    const parsed = parseProductFields(body, { partial: true });
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const product = await updateProduct(id, parsed.fields);
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Impossible de mettre à jour le produit." }, { status: 500 });
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
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer le produit." },
      { status: 500 },
    );
  }
}
