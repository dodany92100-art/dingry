"use client";

import { useEffect, useState } from "react";
import { DINGRY_LOGO_URL } from "@/lib/dingry-brand";
import { DINGRY_MANIFESTO_FR } from "@/lib/dingry-brand-voice";
import {
  COUNTDOWN_UNITS,
  DINGRY_COUNTDOWN_LABEL,
  DINGRY_COUNTDOWN_TARGET_AT,
  DINGRY_SITE_CONSTRUCTION_LABEL,
  countdownFinished,
  countdownParts,
  type CountdownParts,
} from "@/lib/dingry-countdown";

type DingryConstructionScreenProps = {
  displayClassName: string;
};

export function DingryConstructionScreen({ displayClassName }: DingryConstructionScreenProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts: CountdownParts | null =
    now === null ? null : countdownParts(DINGRY_COUNTDOWN_TARGET_AT, now);
  const done = now !== null && countdownFinished(DINGRY_COUNTDOWN_TARGET_AT, now);

  return (
    <div className={`relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center ${displayClassName}`}>
      <img
        src={DINGRY_LOGO_URL}
        alt="DINGRY Paris"
        className="h-auto w-[min(52vw,220px)] brightness-0 invert"
      />
      <p className="dingry-typo-manifesto mt-5 text-[10px] tracking-[0.28em]">{DINGRY_MANIFESTO_FR}</p>

      <p className="mt-10 text-[11px] tracking-[0.42em] text-white/80 sm:text-xs">
        {DINGRY_SITE_CONSTRUCTION_LABEL.toUpperCase()}
      </p>
      <p className="mt-3 text-[clamp(1.75rem,5vw,2.75rem)] leading-[0.95] tracking-[0.04em] text-white">
        {done ? "BIENTÔT EN LIGNE" : "JEUDI · 20H"}
      </p>
      <p className="mt-4 text-[11px] tracking-[0.28em] text-white/85 sm:text-xs">{DINGRY_COUNTDOWN_LABEL}</p>

      {!done ? (
        <div className="mt-8 flex items-start justify-center gap-0" aria-live="polite">
          {COUNTDOWN_UNITS.map((unit, index) => (
            <div key={unit.key} className="flex items-start">
              {index > 0 ? <span className="mx-3 mt-1 text-2xl font-light text-white/35 sm:mx-4">|</span> : null}
              <div className="min-w-[3.1rem] sm:min-w-[3.6rem]">
                <p className="text-[clamp(1.7rem,4vw,2.5rem)] leading-none tabular-nums">
                  {parts ? parts[unit.key] : "––"}
                </p>
                <p className="mt-2 text-[9px] tracking-[0.18em] text-white/70 uppercase sm:text-[10px]">
                  {unit.key === "days"
                    ? "Jours"
                    : unit.key === "hours"
                      ? "Heures"
                      : unit.key === "minutes"
                        ? "Minutes"
                        : "Secondes"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <a
        href="https://www.instagram.com/dingry_officiel/"
        target="_blank"
        rel="noreferrer"
        className="mt-14 text-[10px] tracking-[0.24em] text-white/70 uppercase underline-offset-4 hover:text-white hover:underline"
      >
        Instagram @dingry_officiel
      </a>
    </div>
  );
}
