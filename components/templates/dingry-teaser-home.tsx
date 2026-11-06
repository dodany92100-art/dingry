import type { Metadata } from "next";
import { Anton } from "next/font/google";
import { DingryTeaser } from "@/components/templates/dingry-teaser";
import { DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

export const teaserHomeMetadata: Metadata = {
  title: "DINGRY Paris — 7 novembre",
  description: "Ouverture du site officiel DINGRY Paris le 7 novembre 2026 à 20h (Europe/Paris). Travaux en cours.",
};

/** Accueil teasing prod — visuel plein écran sans calques d’assombrissement. */
export default function DingryTeaserHome() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-black text-white">
      <h1 className="sr-only">
        DINGRY Paris. Ouverture du site officiel le 7 novembre 2026 à 20h. Travaux en cours.
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
