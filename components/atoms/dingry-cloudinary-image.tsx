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
  /** Modale / contain : pas de `h-full w-full` sur `<picture>`. */
  fitContent?: boolean;
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
  fitContent = false,
}: DingryCloudinaryImageProps) {
  if (!src.trim()) return null;

  const safeSrc = browserSafeImageUrl(canonicalizeR2PublicImageUrl(src));
  const targetWidth = deliveryWidth ?? width;
  const picture = buildCloudinaryPictureSet(safeSrc, targetWidth);
  const naturalFit = {
    width: "auto",
    height: "auto",
    maxWidth: "100%",
    maxHeight: "min(70vh, 720px)",
    objectFit: "contain" as const,
  };

  if (fitContent && !picture) {
    return (
      <img
        src={safeSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
        className={cn(className)}
        style={naturalFit}
      />
    );
  }

  if (picture) {
    return (
      <picture className={cn("block", fitContent ? "h-auto w-auto max-w-full" : "h-full w-full")}>
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
          style={fitContent ? naturalFit : undefined}
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
