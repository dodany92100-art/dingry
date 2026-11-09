import type { Metadata } from "next";
import { DingryConstructionScreen } from "@/components/templates/dingry-construction-screen";
import { DINGRY_OPEN_GRAPH_IMAGE, DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import { anton } from "@/lib/dingry-fonts";

export const constructionHomeMetadata: Metadata = {
  title: "DINGRY Paris — Site en construction",
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

/** Accueil construction — compteur jeudi 20h. */
export default function DingryConstructionHome() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-black text-white">
      <h1 className="sr-only">DINGRY Paris. Site en construction. Jeudi 12 novembre 2026 à 20h.</h1>
      <img
        src={DINGRY_TEASING_HERO_SRC}
        alt=""
        className="fixed inset-0 h-full w-full object-cover object-center brightness-90"
      />
      <div className="fixed inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/55" aria-hidden />
      <DingryConstructionScreen displayClassName={anton.className} />
    </main>
  );
}
