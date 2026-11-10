"use client";

import { DingryProductImage } from "@/components/atoms/dingry-product-image";
import { resolveOptionVisual, type ShopProductOption } from "@/lib/catalog/product-options";
import { buildVariantAltText } from "@/lib/catalog/dingry-variant-naming";

type DingryVariantProductImageProps = {
  productName: string;
  parentImage: string;
  parentAlt?: string;
  options?: readonly ShopProductOption[];
  selectedOptionKey?: string;
  className?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Modale vente : pas de filtre sombre, image entière (contain). */
  presentation?: "card" | "modal";
};

/** Image fiche produit : URL R2 de la variante + `alt` SEO dynamique. */
export function DingryVariantProductImage({
  productName,
  parentImage,
  parentAlt,
  options = [],
  selectedOptionKey,
  className = "relative aspect-[3/4] w-full overflow-hidden",
  imgClassName = "h-full w-full object-cover",
  width = 600,
  height = 800,
  priority = false,
  presentation = "card",
}: DingryVariantProductImageProps) {
  const isModal = presentation === "modal";
  const { image, option } = resolveOptionVisual(parentImage, options, selectedOptionKey);
  const alt =
    option?.altText?.trim() ||
    (option ? buildVariantAltText(productName, option.label) : parentAlt?.trim() || buildVariantAltText(productName, ""));

  return (
    <div
      className={className}
      style={isModal ? undefined : { filter: "brightness(0.85) contrast(1.05) grayscale(0.2)" }}
    >
      <DingryProductImage
        src={image}
        alt={alt}
        width={width}
        height={height}
        deliveryWidth={isModal ? 720 : 640}
        priority={priority}
        className={imgClassName}
        sizes={isModal ? "(max-width: 768px) 100vw, min(50vw, 600px)" : "(max-width: 768px) 100vw, 50vw"}
        fitContent={isModal}
      />
    </div>
  );
}
