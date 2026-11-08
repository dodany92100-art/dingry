import type { Metadata } from "next";
import { Suspense } from "react";
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

function ShopLoadingFallback() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-black text-[10px] tracking-[0.35em] text-white/45 uppercase"
      aria-live="polite"
    >
      Chargement…
    </div>
  );
}

export default function WebsiteDxPage() {
  return (
    <Suspense fallback={<ShopLoadingFallback />}>
      <DingryShopPage />
    </Suspense>
  );
}
