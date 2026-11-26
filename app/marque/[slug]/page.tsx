import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopLoadingFallback } from "@/components/atoms/shop-loading-fallback";
import DingryBrandPage from "@/components/pages/dingry-brand-page";
import { BRAND_PAGE_SLUGS, brandPageConfigForSlug } from "@/lib/shop-brand-page-config";
import { parseBrandPageSlug } from "@/lib/shop-brand-page-slug";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BRAND_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = brandPageConfigForSlug(slug);
  if (!config) return {};
  return {
    title: `${config.brand} — DINGRY`,
    description: `Collection ${config.brand} sur la boutique DINGRY.`,
  };
}

export default async function MarqueRoutePage({ params }: PageProps) {
  const { slug } = await params;
  if (!parseBrandPageSlug(slug)) notFound();
  return (
    <Suspense fallback={<ShopLoadingFallback />}>
      <DingryBrandPage slug={slug} />
    </Suspense>
  );
}