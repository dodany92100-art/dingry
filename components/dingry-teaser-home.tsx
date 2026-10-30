import type { Metadata } from "next";
import { Anton } from "next/font/google";
import { DingryTeaser } from "@/components/dingry-teaser";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

export const teaserHomeMetadata: Metadata = {
  title: "DINGRY Paris — 6 novembre",
  description: "Ouverture du site officiel DINGRY Paris le 6 novembre 2026.",
};

/** Accueil teasing prod — visuel plein écran sans calques d’assombrissement. */
export default function DingryTeaserHome() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-black text-white">
      <h1 className="sr-only">DINGRY Paris. Ouverture du site officiel le 6 novembre 2026.</h1>
      <img
        src="/dingry-teasing.jpg"
        alt=""
        className="fixed inset-0 h-full w-full object-cover object-center"
      />
      <DingryTeaser displayClassName={anton.className} />
    </main>
  );
}
