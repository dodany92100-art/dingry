"use client";

import { useState } from "react";
import { ProductImageFlip } from "@/components/molecules/product-image-flip";
import { resolveStockStatusLabel } from "@/components/organisms/admin/admin-stock-status-badge";
import type { AdminProduct } from "@/lib/admin/types";
import { isDraftPlaceholderImage, printPlacementDisplayLabel } from "@/lib/admin/types";
import type {
  ProductCategory,
  ProductPrintPlacement,
  ProductPublishStatus,
  ProductSize,
} from "@/lib/admin/types";

export type AdminProductPreviewModel = {
  name: string;
  variant: string;
  category: ProductCategory;
  price: string;
  sizes: ProductSize[];
  description: string;
  printPlacement: ProductPrintPlacement;
  /** Recto / face principale. */
  imageSrc: string;
  /** Verso / dos (optionnel). */
  imageBackSrc: string;
  publishStatus: ProductPublishStatus;
  stock: number;
};

type AdminProductPreviewProps = {
  model: AdminProductPreviewModel;
  className?: string;
};

function previewProductFromModel(model: AdminProductPreviewModel): AdminProduct {
  return {
    id: "preview",
    sku: "PREVIEW",
    name: model.name.trim() || "Nouveau produit",
    variant: model.variant.trim() || "—",
    description: model.description,
    printPlacement: model.printPlacement,
    fabrication: "",
    limitedEdition: "",
    materials: "",
    sizeGuide: "",
    category: model.category,
    price: Number(model.price) || 0,
    sizes: model.sizes,
    stock: model.stock,
    publishStatus: model.publishStatus,
    colorDeclinations: [],
    imageUrl: model.imageSrc || "/dingry-draft-product.svg",
    blobUrl: null,
    blobPathname: null,
    imageBackUrl: model.imageBackSrc.trim(),
    imageBackBlobUrl: null,
    imageBackBlobPathname: null,
    createdAt: new Date().toISOString(),
    isPinned: false,
    displayOrder: 0,
  };
}

export function AdminProductPreview({ model, className = "" }: AdminProductPreviewProps) {
  const product = previewProductFromModel(model);
  const status = resolveStockStatusLabel(product);
  const priceLabel = Number(model.price) > 0 ? `${model.price} €` : "— €";
  const sizesLabel = model.sizes.length > 0 ? model.sizes.join(" · ") : "Tailles à définir";
  const printLabel = model.printPlacement ? printPlacementDisplayLabel(model.printPlacement) : "";

  const recto = model.imageSrc.trim();
  const verso = model.imageBackSrc.trim();
  const hasRecto = recto.length > 0 && !isDraftPlaceholderImage(recto);
  const hasVerso = verso.length > 0 && !isDraftPlaceholderImage(verso);
  const flippable = hasRecto && hasVerso;

  const [side, setSide] = useState<"recto" | "verso">("recto");

  return (
    <div
      className={`dingry-admin-stock flex flex-col overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900 ${className}`}
      aria-live="polite"
      aria-label="Aperçu fiche produit"
    >
      <div className="border-b border-zinc-800 px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Live preview</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-400">{model.category}</p>
      </div>

      <div className="relative flex min-h-[14rem] w-full flex-col items-stretch justify-center bg-zinc-950 px-3 py-4 sm:min-h-[16rem] sm:px-4 lg:min-h-[20rem]">
        {flippable ? (
          <div
            className="mx-auto w-full max-w-[14rem] sm:max-w-[16rem]"
            onMouseEnter={() => setSide("verso")}
            onMouseLeave={() => setSide("recto")}
          >
            <ProductImageFlip
              frontImage={recto}
              backImage={verso}
              side={side}
              onDoubleTapFlip={() => setSide((current) => (current === "recto" ? "verso" : "recto"))}
              alt={product.name}
              imgClassName="max-h-64 object-contain object-center sm:max-h-72 lg:max-h-80"
            />
            <p className="mt-2 text-center text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              Survol · recto / verso
            </p>
          </div>
        ) : hasRecto ? (
          <img
            src={recto}
            alt=""
            className="mx-auto max-h-64 w-full max-w-full object-contain object-center sm:max-h-72 lg:max-h-80"
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            Aperçu image · upload recto ou brouillon
          </div>
        )}
      </div>

      <div className="space-y-1.5 border-t border-zinc-800 px-3 py-3">
        <h3 className="line-clamp-2 text-[11px] font-bold uppercase leading-snug tracking-[0.08em] text-white">
          {product.name}
        </h3>
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400">{product.variant}</p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-white">
          {priceLabel}
          <span className="mx-2 text-zinc-600">·</span>
          {sizesLabel}
        </p>
        {printLabel ? (
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400/90">{printLabel}</p>
        ) : null}
        {model.description.trim() ? (
          <p className="line-clamp-2 text-[10px] leading-relaxed tracking-[0.04em] text-zinc-300">
            {model.description.trim()}
          </p>
        ) : (
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">Description boutique vide</p>
        )}
        <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-500">
          Statut · {status}
          {model.publishStatus === "draft" ? " · brouillon CRM" : " · catalogue"}
        </p>
      </div>
    </div>
  );
}

/** Alias demandé spec Smart CRM */
export const ProductPreview = AdminProductPreview;
