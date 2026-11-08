import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopLoadingFallback } from "@/components/atoms/shop-loading-fallback";
import DingryShopPage from "@/components/pages/dingry-shop-page";
import { DINGRY_META_DESCRIPTION } from "@/lib/dingry-brand-voice";
import { DINGRY_OPEN_GRAPH_IMAGE } from "@/lib/dingry-brand";

export const metadata: Metadata = {
  title: "DINGRY — boutique (accès privé)",
  description: DINGRY_META_DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    title: "DINGRY — boutique",
    description: DINGRY_META_DESCRIPTION,
    images: [DINGRY_OPEN_GRAPH_IMAGE],
  },
};

export default function WebsiteDxPage() {
  return (
    <Suspense fallback={<ShopLoadingFallback />}>
      <DingryShopPage />
    </Suspense>
  );
}
