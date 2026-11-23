"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { deliveryImageUrl } from "@/lib/media/delivery-image-url";
import { cn } from "@/lib/utils";

type DingryProductImageProps = {
  src: string;
  /** Si le CRM renvoie une URL cassée, repli catalogue (ex. legacy Cloudinary). */
  fallbackSrc?: string;
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

function trimUrl(url: string): string {
  return url.trim();
}

/** Source affichée : CRM d’abord, repli via `onError` / contrôle au montage (pas de sonde `new Image()`). */
export function resolveProductImageSrc(primary: string, fallback?: string): string {
  const p = trimUrl(primary);
  const f = trimUrl(fallback ?? "");
  if (!p) return f;
  return p;
}

export type ShouldFallbackOnMountInput = {
  complete: boolean;
  naturalWidth: number;
  /** Déjà sur l’URL de repli. */
  isFallback: boolean;
  /** Repli disponible et distinct de la source CRM affichée en premier. */
  hasFallback: boolean;
};

/** Image CRM déjà en échec au montage (erreur avant hydratation). */
export function shouldFallbackOnMount(input: ShouldFallbackOnMountInput): boolean {
  if (!input.hasFallback || input.isFallback) return false;
  return input.complete && input.naturalWidth === 0;
}

/** Repli lui-même cassé : masquer l’icône brisée (état neutre). */
export function shouldHideBrokenImage(input: ShouldFallbackOnMountInput): boolean {
  if (!input.isFallback) return false;
  return input.complete && input.naturalWidth === 0;
}

function hasDistinctFallback(primary: string, fallback?: string): boolean {
  const p = trimUrl(primary);
  const f = trimUrl(fallback ?? "");
  return Boolean(f && p && f !== p);
}

function isDisplayingFallback(activeSrc: string, fallback?: string): boolean {
  const f = trimUrl(fallback ?? "");
  return Boolean(f && trimUrl(activeSrc) === f);
}

function syncMountFallbackFromImg(
  img: HTMLImageElement,
  primary: string,
  fallback: string | undefined,
  activeSrc: string,
): "fallback" | "hide" | null {
  const hasFallback = hasDistinctFallback(primary, fallback);
  const isFallback = isDisplayingFallback(activeSrc, fallback);
  const input: ShouldFallbackOnMountInput = {
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    isFallback,
    hasFallback,
  };
  if (shouldFallbackOnMount(input)) return "fallback";
  if (shouldHideBrokenImage(input)) return "hide";
  return null;
}

export function DingryProductImage({
  src,
  fallbackSrc,
  alt,
  width = 600,
  height = 800,
  priority = false,
  className,
  sizes = DEFAULT_SIZES,
  deliveryWidth,
  fitContent = false,
}: DingryProductImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [activeSrc, setActiveSrc] = useState(() => resolveProductImageSrc(src, fallbackSrc));
  const [hideBroken, setHideBroken] = useState(false);

  useEffect(() => {
    setActiveSrc(resolveProductImageSrc(src, fallbackSrc));
    setHideBroken(false);
  }, [src, fallbackSrc]);

  const fallbackUrl = trimUrl(fallbackSrc ?? "");

  const applyFallback = useCallback(() => {
    if (hideBroken) return;
    if (fallbackUrl && trimUrl(activeSrc) !== fallbackUrl) {
      setActiveSrc(fallbackUrl);
      return;
    }
    setHideBroken(true);
  }, [activeSrc, fallbackUrl, hideBroken]);

  const onError = useCallback(() => {
    applyFallback();
  }, [applyFallback]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || hideBroken) return;
    const action = syncMountFallbackFromImg(img, src, fallbackSrc, activeSrc);
    if (action === "fallback" && fallbackUrl) {
      setActiveSrc(fallbackUrl);
    } else if (action === "hide") {
      setHideBroken(true);
    }
  }, [activeSrc, fallbackSrc, fallbackUrl, hideBroken, src, deliveryWidth]);

  if (hideBroken) {
    return <span className={cn(className)} aria-hidden />;
  }

  if (!activeSrc.trim() && !src.trim()) return null;

  const safeSrc = deliveryImageUrl(activeSrc.trim() ? activeSrc : src, deliveryWidth);
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
        ref={imgRef}
        src={safeSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        {...(priority ? { fetchPriority: "high" as const } : {})}
        decoding="async"
        draggable={false}
        onError={onError}
        className={cn(className)}
        style={naturalFit}
      />
    );
  }

  return (
    <Image
      ref={imgRef}
      src={safeSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      decoding="async"
      draggable={false}
      onError={onError}
      className={cn(className)}
    />
  );
}

/** @deprecated Nom historique — utiliser DingryProductImage. */
export const DingryCloudinaryImage = DingryProductImage;