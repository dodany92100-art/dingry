"use client";

import Image from "next/image";
import { buildCloudinaryPictureSet } from "@/lib/cloudinary-url";
import { browserSafeImageUrl } from "@/lib/media/browser-safe-image-url";
import { canonicalizeR2PublicImageUrl } from "@/lib/r2/config";
import { cn } from "@/lib/utils";

type DingryCloudinaryImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Largeur livraison Cloudinary (défaut = width). */
  deliveryWidth?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

const DEFAULT_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

/** Cloudinary : `<picture>` AVIF/WebP/JPG. R2 et autres : `next/image` simple. */
export function DingryCloudinaryImage({
  src,
  alt,
  width = 600,
  height = 800,
  deliveryWidth,
  priority = false,
  className,
  sizes = DEFAULT_SIZES,
}: DingryCloudinaryImageProps) {
  if (!src.trim()) return null;

  const safeSrc = browserSafeImageUrl(canonicalizeR2PublicImageUrl(src));
  const targetWidth = deliveryWidth ?? width;
  const picture = buildCloudinaryPictureSet(safeSrc, targetWidth);

  if (picture) {
    return (
      <picture className="block h-full w-full">
        <source srcSet={picture.avif} type="image/avif" />
        <source srcSet={picture.webp} type="image/webp" />
        <img
          src={picture.fallback}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          draggable={false}
          className={cn(className)}
        />
      </picture>
    );
  }

  return (
    <Image
      src={safeSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      decoding="async"
      unoptimized
      draggable={false}
      className={cn(className)}
    />
  );
}
