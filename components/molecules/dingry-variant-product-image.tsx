"use client";

import { DingryCloudinaryImage } from "@/components/atoms/dingry-cloudinary-image";
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
}: DingryVariantProductImageProps) {
  const { image, option } = resolveOptionVisual(parentImage, options, selectedOptionKey);
  const alt =
    option?.altText?.trim() ||
    (option ? buildVariantAltText(productName, option.label) : parentAlt?.trim() || buildVariantAltText(productName, ""));

  return (
    <div
      className={className}
      style={{ filter: "brightness(0.85) contrast(1.05) grayscale(0.2)" }}
    >
      <DingryCloudinaryImage
        src={image}
        alt={alt}
        width={width}
        height={height}
        deliveryWidth={640}
        priority={priority}
        className={imgClassName}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
