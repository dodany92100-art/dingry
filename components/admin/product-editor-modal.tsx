"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ADMIN_VARIANT_PRESETS,
  defaultVariantForCategory,
} from "@/lib/admin/product-variant-presets";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_SIZES,
  type AdminProduct,
  type ProductCategory,
  type ProductSize,
} from "@/lib/admin/types";
import { prepareProductImage } from "@/lib/client/prepare-product-image";
import type { SaveProductResult } from "./hooks/use-admin-products";

/** Stock initial à la création uniquement. En modification, le stock passe par les boutons ±. */
const INITIAL_STOCK = "10";

type FormState = {
  sku: string;
  name: string;
  variant: string;
  description: string;
  category: ProductCategory;
  price: string;
  sizes: ProductSize[];
};

function formFrom(product: AdminProduct | null): FormState {
  if (!product) {
    return {
      sku: "DINGRY-",
      name: "",
      variant: defaultVariantForCategory("Tee"),
      description: "",
      category: "Tee",
      price: "35",
      sizes: ["S", "M", "L", "XL"],
    };
  }
  return {
    sku: product.sku,
    name: product.name,
    variant: product.variant,
    description: product.description,
    category: product.category,
    price: String(product.price),
    sizes: [...product.sizes],
  };
}

type ProductEditorModalProps = {
  /** null = création. */
  initial: AdminProduct | null;
  busyProductId: string | null;
  onClose: () => void;
  onSubmit: (editingId: string | null, formData: FormData) => Promise<SaveProductResult>;
  /** Retourne true si le produit a été supprimé (le modal se ferme alors). */
  onDelete: (product: AdminProduct) => Promise<boolean>;
};

export function ProductEditorModal({
  initial,
  busyProductId,
  onClose,
  onSubmit,
  onDelete,
}: ProductEditorModalProps) {
  const [current, setCurrent] = useState<AdminProduct | null>(initial);
  const [form, setForm] = useState<FormState>(() => formFrom(initial));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [convertingImage, setConvertingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const editingId = current?.id ?? null;

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function patch(update: Partial<FormState>) {
    setForm((previous) => ({ ...previous, ...update }));
  }

  function changeCategory(next: ProductCategory) {
    patch({
      category: next,
      ...(editingId ? {} : { variant: defaultVariantForCategory(next) }),
    });
  }

  function toggleSize(size: ProductSize) {
    setForm((previous) => ({
      ...previous,
      sizes: previous.sizes.includes(size)
        ? previous.sizes.filter((item) => item !== size)
        : [...previous.sizes, size],
    }));
  }

  async function acceptImage(selected: File | null) {
    setFormError("");
    setFormSuccess("");
    if (!selected) {
      setImageFile(null);
      return;
    }
    setConvertingImage(true);
    try {
      setImageFile(await prepareProductImage(selected));
    } catch (error) {
      setImageFile(null);
      setFormError(error instanceof Error ? error.message : "Conversion impossible.");
    } finally {
      setConvertingImage(false);
    }
  }

  function buildFormData(): FormData {
    const formData = new FormData();
    formData.set("sku", form.sku.trim());
    formData.set("name", form.name.trim());
    formData.set("variant", form.variant.trim());
    formData.set("description", form.description.trim());
    formData.set("category", form.category);
    formData.set("price", form.price);
    formData.set("sizes", form.sizes.join(","));
    if (!editingId) formData.set("stock", INITIAL_STOCK);
    if (imageFile) formData.set("image", imageFile);
    return formData;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (convertingImage) {
      setFormError("Conversion de l'image en cours.");
      return;
    }
    if (!editingId && !imageFile) {
      setFormError("Ajoute une image produit.");
      return;
    }
    if (!form.variant.trim()) {
      setFormError("Choisis ou saisis une couleur (variante).");
      return;
    }
    if (form.sizes.length === 0) {
      setFormError("Sélectionne au moins une taille.");
      return;
    }

    setSaving(true);
    try {
      const result = await onSubmit(editingId, buildFormData());
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      setCurrent(result.product);
      setForm(formFrom(result.product));
      setImageFile(null);
      setFormSuccess("Dingry collection mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!current) return;
    if (await onDelete(current)) onClose();
  }

  const previewSrc = imagePreview || current?.imageUrl || "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[rgba(0,0,0,0.8)] p-4 pb-10 sm:p-8"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain border border-white/10 bg-[#0a0a0a] p-5 pb-10">
        <form onSubmit={handleSubmit} className="h-fit">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.28em] text-white/70">
              {editingId ? "Modifier le produit" : "Nouveau produit"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] uppercase tracking-[0.18em] text-white/40 hover:text-white"
            >
              Fermer
            </button>
          </div>

          <div className="mt-5">
            <label className="block text-[10px] uppercase tracking-[0.22em] text-white/40">
              Catégorie
              <select
                value={form.category}
                onChange={(event) => changeCategory(event.target.value as ProductCategory)}
                className="mt-2 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
              >
                {PRODUCT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block text-[10px] uppercase tracking-[0.22em] text-white/40">
            Nom / Titre
            <input
              value={form.name}
              onChange={(event) => patch({ name: event.target.value })}
              required
              className="mt-2 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
            />
          </label>

          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Couleur (variante)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ADMIN_VARIANT_PRESETS[form.category].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => patch({ variant: preset })}
                  className={`border px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-colors ${
                    form.variant.trim().toUpperCase() === preset.toUpperCase()
                      ? "border-white bg-white text-black"
                      : "border-white/20 text-white/55 hover:border-white/45 hover:text-white"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              value={form.variant}
              onChange={(event) => patch({ variant: event.target.value })}
              placeholder="Couleur (ex. NOIR, BLANC, KING BLUE…)"
              className="mt-3 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
            />
          </div>

          <label className="mt-4 block text-[10px] uppercase tracking-[0.22em] text-white/40">
            Prix (€)
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.price}
              onChange={(event) => patch({ price: event.target.value })}
              required
              className="mt-2 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
            />
          </label>

          <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-white/40">Tailles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRODUCT_SIZES.map((size) => {
              const active = form.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`h-9 min-w-10 px-3 text-xs tracking-[0.15em] ${
                    active ? "bg-white text-black" : "border border-white/15 text-white/50"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>

          <label className="mt-5 block text-[10px] uppercase tracking-[0.22em] text-white/40">
            {editingId ? "Remplacer l'image" : "Image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={convertingImage}
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                event.target.value = "";
                void acceptImage(selected);
              }}
              className="mt-2 w-full text-sm text-white/70 file:mr-3 file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.18em] file:text-black disabled:opacity-50"
            />
          </label>
          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/35">
            {convertingImage
              ? "Conversion WebP…"
              : imageFile
                ? `WebP prêt · ${Math.max(1, Math.round(imageFile.size / 1024))} Ko`
                : "Jusqu'à 10 Mo · enregistré en WebP, 1 Mo maximum"}
          </p>
          {previewSrc ? <img src={previewSrc} alt="" className="mt-3 h-28 w-20 object-cover" /> : null}

          {formError ? <p className="mt-3 text-sm text-red-400">{formError}</p> : null}
          {formSuccess ? <p className="mt-3 text-sm text-white/70">{formSuccess}</p> : null}

          <button
            type="submit"
            disabled={saving || convertingImage}
            className="mt-5 h-11 w-full bg-white text-[11px] font-bold uppercase tracking-[0.22em] text-black disabled:opacity-50"
          >
            {saving ? "Envoi…" : "Enregistrer"}
          </button>
          {current ? (
            <button
              type="button"
              disabled={busyProductId === current.id}
              onClick={() => void handleDelete()}
              className="mt-3 h-11 w-full border border-red-400/40 text-[11px] uppercase tracking-[0.22em] text-red-400 disabled:opacity-40"
            >
              Supprimer
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
