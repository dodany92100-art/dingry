import type { Metadata } from "next";
import { Anton } from "next/font/google";
import { DingryTeaser } from "@/components/dingry-teaser";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "DINGRY Paris — 6 novembre",
  description: "Ouverture du site officiel DINGRY Paris le 6 novembre 2026.",
};

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-black text-white">
      <h1 className="sr-only">DINGRY Paris. Ouverture du site officiel le 6 novembre 2026.</h1>
      <img
        src="/dingry-teasing.jpg"
        alt=""
        className="fixed inset-0 h-full w-full object-cover object-center"
      />
      <div className="fixed inset-0 bg-black/45" />
      <div className="fixed inset-0 bg-gradient-to-r from-black/75 via-black/20 to-black/65" />
      <div className="fixed inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35" />
      <DingryTeaser displayClassName={anton.className} />
    </main>
  );
}
