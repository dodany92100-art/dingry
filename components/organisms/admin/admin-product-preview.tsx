"use client";

import { useState } from "react";
import { ProductImageFlip } from "@/components/molecules/product-image-flip";
import { resolveStockStatusLabel } from "@/components/organisms/admin/admin-stock-status-badge";
import { DingryPaintSwatch } from "@/components/atoms/dingry-paint-swatch";
import {
  colorDeclinationsCanonicallyEqual,
  frenchLabelForColorPreset,
} from "@/lib/admin/dingry-color-palette";
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
  colorDeclinations: readonly string[];
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
    colorDeclinations: [...model.colorDeclinations],
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

  const colorDeclinations = model.colorDeclinations.filter((c) => c.trim().length > 0);

  /** Même cadre recto seul ou flip — évite le plein rail vs l’ancien 14rem. */
  const previewImageFrameClass =
    "mx-auto w-full max-w-[15rem] sm:max-w-[17rem]";
  const previewImageClass =
    "mx-auto max-h-52 w-full object-contain object-center sm:max-h-56 lg:max-h-60";

  return (
    <div
      className={`dingry-admin-product-preview dingry-admin-stock flex flex-col overflow-hidden rounded-xl border border-[rgb(191_149_63/0.32)] bg-[#0a0a0a] shadow-[inset_0_1px_0_rgb(252_246_186/0.08),0_0_28px_rgb(191_149_63/0.07)] ${className}`}
      aria-live="polite"
      aria-label="Aperçu fiche produit"
    >
      <div className="border-b border-white/[0.08] bg-[rgb(191_149_63/0.04)] px-4 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[rgb(252_246_186/0.55)]">
          Live preview
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-400">{model.category}</p>
      </div>

      <div
        className={`relative flex w-full flex-col items-stretch justify-center bg-black px-3 py-3 sm:px-4 ${
          hasRecto ? "min-h-0" : "min-h-[12rem] sm:min-h-[14rem]"
        }`}
      >
        {flippable ? (
          <div
            className={previewImageFrameClass}
            onMouseEnter={() => setSide("verso")}
            onMouseLeave={() => setSide("recto")}
          >
            <ProductImageFlip
              frontImage={recto}
              backImage={verso}
              side={side}
              onDoubleTapFlip={() => setSide((current) => (current === "recto" ? "verso" : "recto"))}
              alt={product.name}
              className="w-full max-h-52 sm:max-h-56 lg:max-h-[15rem]"
              imgClassName={previewImageClass}
            />
            <p className="mt-1.5 text-center text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              Survol · recto / verso
            </p>
          </div>
        ) : hasRecto ? (
          <div className={previewImageFrameClass}>
            <img src={recto} alt="" className={previewImageClass} decoding="async" />
          </div>
        ) : (
          <div className="flex min-h-[10rem] items-center justify-center px-4 text-center text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            Aperçu image · upload recto ou brouillon
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-[rgb(191_149_63/0.18)] px-3 py-3">
        <h3 className="line-clamp-2 text-[11px] font-bold uppercase leading-snug tracking-[0.08em] text-white">
          {product.name}
        </h3>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">{product.variant}</p>
        {colorDeclinations.length > 0 ? (
          <div
            className="flex flex-wrap items-center gap-1.5"
            aria-label={`${colorDeclinations.length} couleur${colorDeclinations.length > 1 ? "s" : ""} sélectionnée${colorDeclinations.length > 1 ? "s" : ""}`}
          >
            {colorDeclinations.map((color) => {
              const active = colorDeclinationsCanonicallyEqual(color, model.variant);
              const label = frenchLabelForColorPreset(color);
              return (
                <span key={color} title={active ? `${label} · variante active` : label}>
                  <DingryPaintSwatch
                    colorKey={color}
                    size="sm"
                    active={active}
                    variant="preview"
                    className="border border-white/15"
                  />
                </span>
              );
            })}
          </div>
        ) : null}
        <p className="text-[11px] uppercase tracking-[0.14em] text-white">
          <span className="font-semibold tabular-nums">{priceLabel}</span>
          <span className="mx-1.5 text-zinc-600">·</span>
          <span className="text-white/85">{sizesLabel}</span>
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
