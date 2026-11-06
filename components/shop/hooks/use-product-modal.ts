"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductFlipSide } from "@/components/product-image-flip";
import type { ShopProduct } from "@/lib/catalog";
import { productSlugForCatalogId, rectoIdFromProductSlug } from "@/lib/dingry-product-copy";
import {
  isJerseyShopProduct,
  jerseyColorKeyFromProduct,
  type JerseyColorKey,
} from "@/lib/jersey-shop";
import type { CatalogState } from "./use-shop-catalog";

type Options = { products: ShopProduct[]; catalogState: CatalogState };

/** Fiche produit : sélection, taille, quantité, face, couleur jersey, lien profond ?produit=slug. */
export function useProductModal({ products, catalogState }: Options) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [modalSide, setModalSide] = useState<"recto" | "verso">("recto");
  const [jerseyColor, setJerseyColor] = useState<JerseyColorKey>("BLANC");
  const productModalRef = useRef<HTMLDivElement>(null);
  const productImageRef = useRef<HTMLDivElement>(null);
  /** Slug attendu après router.replace — évite le flash variante (URL encore sur l’ancien ?produit=). */
  const pendingProductSlugRef = useRef<string | null>(null);

  // Lien profond : ouvre la fiche correspondant au slug quand le catalogue est prêt.
  useEffect(() => {
    if (catalogState !== "ready") return;
    const slug = searchParams.get("produit");

    if (pendingProductSlugRef.current !== null) {
      const pending = pendingProductSlugRef.current;
      if (pending === "") {
        if (slug) return;
        pendingProductSlugRef.current = null;
      } else if (slug === pending) {
        pendingProductSlugRef.current = null;
      } else {
        return;
      }
    }

    if (!slug) return;
    const rectoId = rectoIdFromProductSlug(slug);
    if (!rectoId) return;
    const product = products.find((item) => item.id === rectoId);
    if (!product) return;
    if (selectedProduct?.id === product.id) return;

    setSelectedProduct(product);
    setSelectedSize("");
    setModalSide("recto");
    if (isJerseyShopProduct(product)) {
      setJerseyColor(jerseyColorKeyFromProduct(product));
    }
  }, [catalogState, searchParams, products, selectedProduct?.id]);

  const syncProductInUrl = useCallback(
    (product: ShopProduct | null) => {
      const params = new URLSearchParams(searchParams.toString());
      let pendingSlug: string | null = null;
      if (product) {
        const slug = productSlugForCatalogId(product.id);
        if (slug) {
          params.set("produit", slug);
          pendingSlug = slug;
        } else {
          params.delete("produit");
        }
      } else {
        params.delete("produit");
        pendingSlug = "";
      }
      pendingProductSlugRef.current = pendingSlug;
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  function applyProductSelection(product: ShopProduct, side: ProductFlipSide) {
    setSelectedProduct(product);
    setSelectedSize("");
    setModalSide(side);
    if (isJerseyShopProduct(product)) {
      setJerseyColor(jerseyColorKeyFromProduct(product));
    }
  }

  function scrollProductModalToTop() {
    window.requestAnimationFrame(() => {
      productModalRef.current?.scrollTo({ top: 0, behavior: "instant" });
    });
  }

  function openProductModal(product: ShopProduct, side: ProductFlipSide = "recto") {
    if (selectedProduct?.id === product.id && modalSide === side) {
      return;
    }
    const switchingVariant =
      selectedProduct !== null && selectedProduct.id !== product.id;
    applyProductSelection(product, side);
    syncProductInUrl(product);
    if (switchingVariant) {
      scrollProductModalToTop();
    }
  }

  /** Variante couleur (même ligne) : pas de re-sync URL si slug inchangé côté UX — scroll stable. */
  function switchProductVariant(product: ShopProduct) {
    if (selectedProduct?.id === product.id) return;
    applyProductSelection(product, "recto");
    syncProductInUrl(product);
    scrollProductModalToTop();
  }

  function closeProductModal() {
    syncProductInUrl(null);
    setSelectedProduct(null);
  }

  function showProductSide(side: "recto" | "verso") {
    setModalSide(side);
    if (side !== "verso") return;
    window.requestAnimationFrame(() => {
      const image = productImageRef.current;
      const modal = productModalRef.current;
      if (!image || !modal) return;
      const top = image.getBoundingClientRect().top - modal.getBoundingClientRect().top + modal.scrollTop;
      modal.scrollTo({ top, behavior: "smooth" });
    });
  }

  /** Après « Ajouter au panier » : ferme la fiche et retire ?produit= de l’URL. */
  const clearSelectionAfterAdd = useCallback(() => {
    syncProductInUrl(null);
    setSelectedProduct(null);
    setSelectedSize("");
    setSelectedQuantity(1);
  }, [syncProductInUrl]);

  return {
    selectedProduct,
    selectedSize,
    setSelectedSize,
    selectedQuantity,
    setSelectedQuantity,
    modalSide,
    jerseyColor,
    setJerseyColor,
    productModalRef,
    productImageRef,
    openProductModal,
    switchProductVariant,
    closeProductModal,
    showProductSide,
    clearSelectionAfterAdd,
  };
}

export type ProductModalState = ReturnType<typeof useProductModal>;
