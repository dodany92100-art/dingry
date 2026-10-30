import type { Metadata } from "next";
import { Anton } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "DINGRY Paris — 6 novembre",
  description: "DINGRY Paris. Site officiel en ligne le 6 novembre.",
};

const LINE = "DINGRY PARIS — SITE OFFICIEL EN LIGNE LE 6 NOVEMBRE";

export default function HomePage() {
  const loop = [0, 1];

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-black text-white">
      <h1 className="sr-only">DINGRY Paris. Site officiel en ligne le 6 novembre.</h1>
      <div className="relative min-h-0 flex-1 bg-black">
        <img
          src="/dingry-teasing.jpg"
          alt="Look DINGRY Paris, jersey noir."
          className="h-full w-full object-contain object-center"
        />
      </div>
      <div className="shrink-0 overflow-hidden border-t border-white/15 bg-black py-3 md:py-4" aria-hidden>
        <div className={`${anton.className} dingry-tease-track flex w-max`}>
          {loop.map((copy) => (
            <p key={copy} className="flex shrink-0 items-center">
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  key={index}
                  className="px-6 text-[clamp(1.35rem,3.6vw,2.75rem)] leading-none tracking-[0.06em] uppercase"
                >
                  {LINE}
                  <span className="px-6 text-white/30">●</span>
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
