"use client";

import { useEffect, useState, type FormEvent } from "react";

const OPENING_AT = Date.parse("2026-11-06T00:00:00+01:00");

const UNITS = [
  { key: "days", label: "Jours", seconds: 86_400 },
  { key: "hours", label: "Heures", seconds: 3_600 },
  { key: "minutes", label: "Minutes", seconds: 60 },
  { key: "seconds", label: "Secondes", seconds: 1 },
] as const;

type TeaserProps = {
  displayClassName: string;
};

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" />
    </svg>
  );
}

function countdown(now: number): Record<(typeof UNITS)[number]["key"], string> {
  let remaining = Math.max(0, Math.floor((OPENING_AT - now) / 1000));
  const values = {} as Record<(typeof UNITS)[number]["key"], string>;
  for (const unit of UNITS) {
    const amount = unit.key === "seconds" ? remaining : Math.floor(remaining / unit.seconds);
    if (unit.key !== "seconds") remaining -= amount * unit.seconds;
    values[unit.key] = String(amount).padStart(2, "0");
  }
  return values;
}

export function DingryTeaser({ displayClassName }: TeaserProps) {
  const [now, setNow] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "saved" | "already" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = now === null ? null : countdown(now);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const body = (await response.json()) as { ok?: boolean; already?: boolean; error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(body.error ?? "Inscription impossible.");
        return;
      }
      setStatus(body.already ? "already" : "saved");
      setMessage(body.already ? "Vous êtes déjà inscrit." : "C’est noté. On vous prévient le 6 novembre.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Inscription impossible.");
    }
  }

  return (
    <div className="relative z-10 flex min-h-dvh flex-col px-5 py-7 sm:px-8 md:px-12 lg:px-16">
      <div className="grid flex-1 items-center gap-10 md:grid-cols-2 md:gap-6">
        <div className="w-fit max-w-full md:justify-self-start">
          <p className={`${displayClassName} text-[clamp(2.6rem,6.5vw,4.6rem)] leading-none tracking-[0.04em] text-white`}>
            DINGRY
            <sup className="ml-1 align-super text-[0.32em] tracking-normal">®</sup>
          </p>
          <p className={`${displayClassName} mt-3 text-center text-[clamp(0.95rem,1.6vw,1.25rem)] tracking-[0.42em] text-white`}>
            PARIS
          </p>
          <div className="mx-auto mt-4 h-px w-16 bg-white/80" />
          <p className="mt-3 text-center text-[10px] tracking-[0.28em] text-white/80 sm:text-[11px]">
            LE LUXE EST DANS L&apos;ATTITUDE
          </p>
        </div>

        <div className="md:justify-self-end md:text-right">
          <p className="text-[11px] tracking-[0.42em] text-white/80 sm:text-xs">OUVERTURE DU</p>
          <p className={`${displayClassName} mt-2 text-[clamp(2rem,4.6vw,3.4rem)] leading-[0.92] tracking-[0.02em] text-white`}>
            SITE OFFICIEL
          </p>
          <div className="mt-4 flex items-center gap-3 md:justify-end">
            <span className="h-px w-8 bg-white/75 md:w-10" />
            <p className="text-[11px] tracking-[0.28em] text-white sm:text-xs">LE 6 NOVEMBRE 2026</p>
            <span className="h-px w-8 bg-white/75 md:w-10" />
          </div>
          <div className="mt-6 flex items-start justify-start gap-0 md:justify-end" aria-live="polite">
            {UNITS.map((unit, index) => (
              <div key={unit.key} className="flex items-start">
                {index > 0 ? <span className="mx-3 mt-1 text-2xl font-light text-white/35 sm:mx-4">|</span> : null}
                <div className="min-w-[3.1rem] text-center sm:min-w-[3.6rem]">
                  <p className={`${displayClassName} text-[clamp(1.7rem,3vw,2.35rem)] leading-none tabular-nums`}>
                    {parts ? parts[unit.key] : "––"}
                  </p>
                  <p className="mt-2 text-[9px] tracking-[0.18em] text-white/70 uppercase sm:text-[10px]">{unit.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mb-5 text-white/55" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>

      <form onSubmit={onSubmit} className="mx-auto w-full max-w-xl">
        <label htmlFor="teaser-email" className="sr-only">
          Inscrivez-vous pour être informé
        </label>
        <div className="flex items-center rounded-full border border-white/55 bg-black/35 py-1 pr-1 pl-5 backdrop-blur-sm">
          <input
            id="teaser-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={180}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "sending") setStatus("idle");
            }}
            placeholder="Inscrivez-vous pour être informé"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[11px] tracking-[0.16em] text-white uppercase outline-none placeholder:text-white/75 sm:text-xs"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-black uppercase transition-opacity disabled:opacity-60"
          >
            {status === "sending" ? "…" : "OK →"}
          </button>
        </div>
        <input
          name="website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="sr-only"
        />
        <p className="mt-3 min-h-5 text-center text-xs tracking-wide text-white/80" role="status">
          {message}
        </p>
      </form>

      <div className="mt-2 flex items-end justify-between gap-4">
        <a
          href="https://www.instagram.com/dingry_officiel/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram @dingry_officiel"
          className="text-white/80 transition-colors hover:text-white"
        >
          <InstagramIcon />
        </a>
        <p className="text-[10px] tracking-[0.22em] text-white/70 uppercase sm:text-[11px]">
          Shop <span className="px-1.5 text-white/35">|</span> Culture <span className="px-1.5 text-white/35">|</span>{" "}
          Attitude
        </p>
      </div>
    </div>
  );
}
