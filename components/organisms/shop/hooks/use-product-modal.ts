"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import type { ShopProduct } from "@/lib/catalog";
import { productSlugForCatalogId, rectoIdFromProductSlug } from "@/lib/dingry-product-copy";
import {
  isJerseyShopProduct,
  jerseyColorKeyFromProduct,
  type JerseyColorKey,
} from "@/lib/jersey-shop";
import { normalizeOptionKey, resolveOptionVisual } from "@/lib/catalog/product-options";
import { assertShopProductModalReady } from "@/lib/shop-product-integrity";
import { shopBasePathFromPathname } from "@/lib/shop-base-path";
import type { CatalogState } from "./use-shop-catalog";

type Options = { products: ShopProduct[]; catalogState: CatalogState };

/** Fiche produit : sélection, taille, quantité, face, couleur jersey, lien profond ?produit=slug. */
function currentSearchParams(fallback: string): URLSearchParams {
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams(fallback);
}

export function useProductModal({ products, catalogState }: Options) {
  const pathname = usePathname();
  const shopBasePath = shopBasePathFromPathname(pathname ?? "/");
  const searchParams = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [modalSide, setModalSide] = useState<"recto" | "verso">("recto");
  const [jerseyColor, setJerseyColor] = useState<JerseyColorKey>("BLANC");
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const productModalRef = useRef<HTMLDivElement>(null);
  const productImageRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<number | null>(null);
  const modalSideRef = useRef<"recto" | "verso">("recto");
  selectedIdRef.current = selectedProduct?.id ?? null;
  modalSideRef.current = modalSide;
  /** Slug attendu après replaceState — évite le flash variante (URL encore sur l’ancien ?produit=). */
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
      const params = currentSearchParams(searchParams.toString());
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
      const href = query ? `${shopBasePath}?${query}` : shopBasePath;
      startTransition(() => {
        window.history.replaceState(window.history.state, "", href);
      });
    },
    [searchParams, shopBasePath],
  );

  function defaultOptionKey(product: ShopProduct): string {
    const options = product.options ?? [];
    const def = options.find((o) => o.isDefault) ?? options[0];
    return def?.optionKey ?? "";
  }

  function applyProductSelection(product: ShopProduct, side: ProductFlipSide) {
    setSelectedProduct(product);
    setSelectedSize("");
    setModalSide(side);
    setSelectedOptionKey(defaultOptionKey(product));
    if (isJerseyShopProduct(product)) {
      setJerseyColor(jerseyColorKeyFromProduct(product));
    }
  }

  function switchParentOption(optionKey: string) {
    const key = normalizeOptionKey(optionKey);
    if (!key) return;
    setSelectedOptionKey(key);
    setModalSide("recto");
  }

  function modalHeroImage(product: ShopProduct): string {
    const options = product.options ?? [];
    if (options.length === 0) return product.image;
    return resolveOptionVisual(product.image, options, selectedOptionKey).image;
  }

  function scrollProductModalToTop() {
    window.requestAnimationFrame(() => {
      productModalRef.current?.scrollTo({ top: 0, behavior: "instant" });
    });
  }

  function warnModalBlocked(product: ShopProduct, reason: string) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ProductModal] ouverture refusée", { id: product.id, reason });
    }
  }

  const openProductModal = useCallback(
    (product: ShopProduct, side: ProductFlipSide = "recto") => {
      const ready = assertShopProductModalReady(product);
      if (!ready.ok) {
        warnModalBlocked(product, ready.reason);
        return;
      }
      if (selectedIdRef.current === product.id && modalSideRef.current === side) {
        return;
      }
      const switchingVariant =
        selectedIdRef.current !== null && selectedIdRef.current !== product.id;
      applyProductSelection(product, side);
      window.requestAnimationFrame(() => syncProductInUrl(product));
      if (switchingVariant) {
        scrollProductModalToTop();
      }
    },
    [syncProductInUrl],
  );

  /** Variante couleur (même ligne) : pas de re-sync URL si slug inchangé côté UX — scroll stable. */
  const switchProductVariant = useCallback(
    (product: ShopProduct) => {
      const ready = assertShopProductModalReady(product);
      if (!ready.ok) {
        warnModalBlocked(product, ready.reason);
        return;
      }
      if (selectedIdRef.current === product.id) return;
      applyProductSelection(product, "recto");
      window.requestAnimationFrame(() => syncProductInUrl(product));
      scrollProductModalToTop();
    },
    [syncProductInUrl],
  );

  const closeProductModal = useCallback(() => {
    setSelectedProduct(null);
    window.requestAnimationFrame(() => syncProductInUrl(null));
  }, [syncProductInUrl]);

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
    setSelectedOptionKey("");
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
    selectedOptionKey,
    switchParentOption,
    modalHeroImage,
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
