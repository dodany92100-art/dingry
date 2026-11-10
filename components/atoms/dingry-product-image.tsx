"use client";

import Image from "next/image";
import { deliveryImageUrl } from "@/lib/media/delivery-image-url";
import { cn } from "@/lib/utils";

type DingryProductImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  /** Largeur cible (réservé ; URL déjà optimisée côté CRM). */
  deliveryWidth?: number;
  /** Modale / contain : pas de `h-full w-full` forcé. */
  fitContent?: boolean;
};

const DEFAULT_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

export function DingryProductImage({
  src,
  alt,
  width = 600,
  height = 800,
  priority = false,
  className,
  sizes = DEFAULT_SIZES,
  deliveryWidth,
  fitContent = false,
}: DingryProductImageProps) {
  if (!src.trim()) return null;

  const safeSrc = deliveryImageUrl(src, deliveryWidth);
  const naturalFit = {
    width: "auto",
    height: "auto",
    maxWidth: "100%",
    maxHeight: "min(78vh, 860px)",
    aspectRatio: "auto",
    objectFit: "contain" as const,
  };

  if (fitContent) {
    return (
      <img
        src={safeSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
        className={cn(className)}
        style={naturalFit}
      />
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

/** @deprecated Nom historique — utiliser DingryProductImage. */
export const DingryCloudinaryImage = DingryProductImage;
