"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type DingryCloudinaryImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

const DEFAULT_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

/** Image Cloudinary / Blob : lazy par défaut, `priority` pour LCP above-the-fold. */
export function DingryCloudinaryImage({
  src,
  alt,
  width = 600,
  height = 800,
  priority = false,
  className,
  sizes = DEFAULT_SIZES,
}: DingryCloudinaryImageProps) {
  if (!src.trim()) return null;

  return (
    <Image
      src={src}
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
