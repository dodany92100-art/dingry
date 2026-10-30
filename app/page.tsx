import type { Metadata } from "next";
import { Suspense } from "react";
import DingryShopPage from "@/components/dingry-shop-page";
import DingryTeaserHome, { teaserHomeMetadata } from "@/components/dingry-teaser-home";

/** Lit l’env à la requête (pas au build) pour que la prod reste en teasing jusqu’au 6 nov. */
export const dynamic = "force-dynamic";

function isTeaserHome(): boolean {
  return process.env.DINGRY_PUBLIC_HOME?.trim().toLowerCase() === "teaser";
}

export async function generateMetadata(): Promise<Metadata> {
  if (isTeaserHome()) return teaserHomeMetadata;
  return {
    title: "DINGRY — True Luxury Is Attitude",
    description: "DINGRY. Rock the street. Collection capsule en édition limitée.",
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
