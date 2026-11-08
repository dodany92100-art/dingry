"use client";

import { useMemo } from "react";
import { ProductCard } from "@/components/molecules/product-card";
import {
  AdminProductPreview,
  type AdminProductPreviewModel,
} from "@/components/organisms/admin/admin-product-preview";
import { AdminStockStatusBadge } from "@/components/organisms/admin/admin-stock-status-badge";
import { previewModelToShopProduct } from "@/lib/admin/product-preview-shop";
import { isShopProductInStock } from "@/lib/catalog";
import { storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import type { AdminProduct } from "@/lib/admin/types";

type AdminProductEditorLivePreviewProps = {
  model: AdminProductPreviewModel;
  productId?: string | null;
};

function adminProductForBadge(model: AdminProductPreviewModel): AdminProduct {
  return {
    id: "preview",
    sku: "APERÇU",
    name: model.name,
    variant: model.variant,
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
    imageUrl: model.imageSrc,
    blobUrl: null,
    blobPathname: null,
    imageBackUrl: model.imageBackSrc,
    imageBackBlobUrl: null,
    imageBackBlobPathname: null,
    createdAt: new Date().toISOString(),
    isPinned: false,
    displayOrder: 0,
  };
}

/** Aperçu temps réel CRM : carte catalogue boutique + fiche (aucune requête réseau). */
export function AdminProductEditorLivePreview({ model, productId }: AdminProductEditorLivePreviewProps) {
  const shopProduct = useMemo(
    () => previewModelToShopProduct(model, productId),
    [model, productId],
  );
  const badgeProduct = useMemo(() => adminProductForBadge(model), [model]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="rounded-2xl border border-sky-500/25 bg-sky-950/20 px-4 py-3 text-[12px] leading-relaxed text-sky-100/90">
        Aperçu local uniquement — les images temporaires (fichier non envoyé) et le formulaire en cours sont
        affichés tels qu’en boutique. Aucune sauvegarde ni appel Supabase.
      </div>

      <section aria-labelledby="crm-preview-catalog-heading">
        <h2
          id="crm-preview-catalog-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/50"
        >
          Vue catalogue
        </h2>
        <div className="dingry-shop mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#f6f6f4] px-4 py-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] md:px-8 md:py-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#0066FF]">Collection</p>
          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-[17rem] sm:max-w-[19rem]">
              <ProductCard
                name={storefrontProductTitle(shopProduct)}
                variant={storefrontProductSubtitle(shopProduct)}
                image={shopProduct.image}
                price={shopProduct.price}
                priority
                soldOut={!isShopProductInStock(shopProduct)}
              />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="crm-preview-detail-heading" className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="crm-preview-detail-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/50"
          >
            Fiche & statut
          </h2>
          <AdminStockStatusBadge product={badgeProduct} />
        </div>
        <AdminProductPreview model={model} className="w-full border-white/10 bg-zinc-950/80" />
      </section>
    </div>
  );
}
