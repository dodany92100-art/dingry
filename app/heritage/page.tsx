import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopLoadingFallback } from "@/components/atoms/shop-loading-fallback";
import DingryHeritagePage from "@/components/pages/dingry-heritage-page";
import { DINGRY_HERITAGE_BASELINE } from "@/lib/dingry-heritage-content";
import { DINGRY_HERITAGE_EDITORIAL_SRC, DINGRY_OPEN_GRAPH_IMAGE } from "@/lib/dingry-brand";

export const metadata: Metadata = {
  title: `Héritage — ${DINGRY_HERITAGE_BASELINE} · DINGRY`,
  description:
    "Manifeste, philosophie et histoire de DINGRY : attitude, indépendance et parcours créateur.",
  openGraph: {
    title: `Héritage — DINGRY`,
    description: DINGRY_HERITAGE_BASELINE,
    images: [{ ...DINGRY_OPEN_GRAPH_IMAGE, url: DINGRY_HERITAGE_EDITORIAL_SRC }],
  },
};

export default function HeritageRoutePage() {
  return (
    <Suspense fallback={<ShopLoadingFallback />}>
      <DingryHeritagePage />
    </Suspense>
  );
}
