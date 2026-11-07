import type { Metadata } from "next";
import { Suspense } from "react";
import DingryShopPage from "@/components/pages/dingry-shop-page";
import DingryTeaserHome, { teaserHomeMetadata } from "@/components/pages/dingry-teaser-home";
import { DINGRY_OPEN_GRAPH_IMAGE } from "@/lib/dingry-brand";
import { DINGRY_META_DESCRIPTION } from "@/lib/dingry-brand-voice";

/** Lit l’env à la requête (pas au build) pour que la prod reste en teasing jusqu’au 6 nov. */
export const dynamic = "force-dynamic";

function isTeaserHome(): boolean {
  return process.env.DINGRY_PUBLIC_HOME?.trim().toLowerCase() === "teaser";
}

export async function generateMetadata(): Promise<Metadata> {
  if (isTeaserHome()) return teaserHomeMetadata;
  return {
    title: "DINGRY — True Luxury Is Attitude",
    description: DINGRY_META_DESCRIPTION,
    openGraph: {
      title: "DINGRY — True Luxury Is Attitude",
      description: DINGRY_META_DESCRIPTION,
      images: [DINGRY_OPEN_GRAPH_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: [DINGRY_OPEN_GRAPH_IMAGE.url],
    },
  };
}

export default function HomePage() {
  if (isTeaserHome()) {
    return <DingryTeaserHome />;
  }
  return (
    <Suspense fallback={null}>
      <DingryShopPage />
    </Suspense>
  );
}
