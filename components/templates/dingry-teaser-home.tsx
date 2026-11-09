import type { Metadata } from "next";
import { DingryTeaser } from "@/components/templates/dingry-teaser";
import { DINGRY_OPEN_GRAPH_IMAGE, DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import { anton } from "@/lib/dingry-fonts";

export const teaserHomeMetadata: Metadata = {
  title: "DINGRY Paris — jeudi 20h",
  description: "Site en construction. Ouverture jeudi 12 novembre 2026 à 20h (Europe/Paris).",
  openGraph: {
    title: "DINGRY Paris — Site en construction",
    description: "Site en construction. Ouverture jeudi 12 novembre 2026 à 20h (Europe/Paris).",
    images: [DINGRY_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [DINGRY_OPEN_GRAPH_IMAGE.url],
  },
};

/** Accueil teasing prod — visuel plein écran sans calques d'assombrissement. */
export default function DingryTeaserHome() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-black text-white">
      <h1 className="sr-only">
        DINGRY Paris. Site en construction. Jeudi 12 novembre 2026 à 20h.
      </h1>
      <img
        src={DINGRY_TEASING_HERO_SRC}
        alt=""
        className="fixed inset-0 h-full w-full object-cover object-center"
      />
      <DingryTeaser displayClassName={anton.className} />
    </main>
  );
}
