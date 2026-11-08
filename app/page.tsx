import type { Metadata } from "next";
import { Suspense } from "react";
import DingryShopPage from "@/components/pages/dingry-shop-page";
import DingryConstructionHome, {
  constructionHomeMetadata,
} from "@/components/pages/dingry-construction-home";
import DingryTeaserHome, { teaserHomeMetadata } from "@/components/pages/dingry-teaser-home";
import { DINGRY_OPEN_GRAPH_IMAGE } from "@/lib/dingry-brand";
import { DINGRY_META_DESCRIPTION } from "@/lib/dingry-brand-voice";
import { DINGRY_TEASER_OPENING_AT } from "@/lib/dingry-teaser-opening";

/** Lit l’env à la requête (pas au build) — avant ouverture : teaser par défaut. */
export const dynamic = "force-dynamic";

function publicHomeMode(): "shop" | "teaser" | "construction" {
  const mode = process.env.DINGRY_PUBLIC_HOME?.trim().toLowerCase() ?? "";
  if (mode === "shop") return "shop";
  if (mode === "teaser") return "teaser";
  if (mode === "construction") return "construction";
  if (Date.now() < DINGRY_TEASER_OPENING_AT) return "teaser";
  return "shop";
}

export async function generateMetadata(): Promise<Metadata> {
  const mode = publicHomeMode();
  if (mode === "teaser") return teaserHomeMetadata;
  if (mode === "construction") return constructionHomeMetadata;
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
  const mode = publicHomeMode();
  if (mode === "construction") {
    return <DingryConstructionHome />;
  }
  if (mode === "teaser") {
    return <DingryTeaserHome />;
  }
  return (
    <Suspense fallback={null}>
      <DingryShopPage />
    </Suspense>
  );
}
