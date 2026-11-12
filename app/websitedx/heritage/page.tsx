import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopLoadingFallback } from "@/components/atoms/shop-loading-fallback";
import DingryHeritagePage from "@/components/pages/dingry-heritage-page";
import { DINGRY_HERITAGE_BASELINE } from "@/lib/dingry-heritage-content";

export const metadata: Metadata = {
  title: `Héritage — DINGRY (accès privé)`,
  description: DINGRY_HERITAGE_BASELINE,
  robots: { index: false, follow: false },
};

export default function WebsiteDxHeritagePage() {
  return (
    <Suspense fallback={<ShopLoadingFallback />}>
      <DingryHeritagePage />
    </Suspense>
  );
}
