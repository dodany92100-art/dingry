"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DINGRY_LOGO_URL } from "@/lib/dingry-brand";
import {
  COUNTDOWN_UNITS,
  DINGRY_COUNTDOWN_LABEL,
  DINGRY_COUNTDOWN_TARGET_AT,
  DINGRY_SITE_CONSTRUCTION_LABEL,
  countdownParts,
  type CountdownParts,
} from "@/lib/dingry-countdown";

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

const OPENING_AT = DINGRY_COUNTDOWN_TARGET_AT;
const UNITS = COUNTDOWN_UNITS.map((u) => ({
  ...u,
  label:
    u.key === "days"
      ? "Jours"
      : u.key === "hours"
        ? "Heures"
        : u.key === "minutes"
          ? "Minutes"
          : "Secondes",
}));

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

  const parts: CountdownParts | null = now === null ? null : countdownParts(OPENING_AT, now);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const trimmed = email.trim();
    if (trimmed.length > 180 || !EMAIL_PATTERN.test(trimmed)) {
      setStatus("error");
      setMessage("Indiquez une adresse e-mail valide.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, website }),
      });
      const body = (await response.json()) as { ok?: boolean; already?: boolean; error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(body.error ?? "Inscription impossible.");
        return;
      }
      setStatus(body.already ? "already" : "saved");
      setMessage(body.already ? "Vous êtes déjà inscrit." : "Merci, vous êtes inscrit.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Inscription impossible.");
    }
  }

  return (
    <div className="relative z-10 flex min-h-[100dvh] w-full max-w-lg flex-col items-center justify-between px-5 py-6 sm:max-w-none sm:px-8 sm:py-8 md:px-12 lg:px-16">
      {/* Mobile : logo haut · compte à rebours bas · desktop : grille 2 col */}
      <div className="relative flex w-full min-h-0 flex-1 flex-col md:grid md:grid-cols-2 md:items-center md:gap-8">
        <section
          aria-label="DINGRY Paris"
          className="relative flex min-h-0 flex-1 flex-col md:col-start-1 md:row-start-1 md:h-auto md:flex-none md:justify-self-start"
        >
          <header className="relative z-20 shrink-0 text-center md:text-left">
            <img
              src={DINGRY_LOGO_URL}
              alt="DINGRY Paris"
              className="mx-auto h-auto w-[min(44vw,190px)] brightness-0 invert md:mx-0 md:w-[min(58vw,240px)]"
            />
            <div className="mx-auto mt-2 h-px w-14 bg-white/80 md:mx-0 md:mt-4 md:w-16" />
          </header>
        </section>

        <section
          aria-label="Ouverture et compte à rebours"
          className="mt-auto shrink-0 space-y-1.5 pb-1 text-center max-md:translate-y-10 sm:max-md:translate-y-12 md:col-start-2 md:row-start-1 md:mt-0 md:translate-y-0 md:justify-self-end md:pb-0 md:text-right"
        >
          <p className="text-[10px] tracking-[0.38em] text-white/80 sm:text-[11px] sm:tracking-[0.42em]">OUVERTURE DU</p>
          <p
            className={`${displayClassName} text-[clamp(1.55rem,4.2vw,3.4rem)] leading-[0.92] tracking-[0.02em] text-white`}
          >
            SITE OFFICIEL
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:justify-end">
            <span className="h-px w-6 bg-white/75 sm:w-8 md:w-10" />
            <p className="text-[10px] tracking-[0.24em] text-white sm:text-[11px] sm:tracking-[0.28em]">
              {DINGRY_COUNTDOWN_LABEL}
            </p>
            <span className="h-px w-6 bg-white/75 sm:w-8 md:w-10" />
          </div>
          <div className="flex items-start justify-center gap-0 md:justify-end" aria-live="polite">
            {UNITS.map((unit, index) => (
              <div key={unit.key} className="flex items-start">
                {index > 0 ? (
                  <span className="mx-2 mt-1 text-xl font-light text-white/35 sm:mx-3 sm:text-2xl md:mx-4">|</span>
                ) : null}
                <div className="min-w-[2.65rem] text-center sm:min-w-[3.1rem] md:min-w-[3.6rem]">
                  <p
                    className={`${displayClassName} text-[clamp(1.45rem,2.8vw,2.35rem)] leading-none tabular-nums`}
                  >
                    {parts ? parts[unit.key] : "––"}
                  </p>
                  <p className="mt-1 text-[8px] tracking-[0.16em] text-white/70 uppercase sm:mt-2 sm:text-[9px] md:text-[10px]">
                    {unit.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mx-auto max-w-md text-[9px] leading-relaxed tracking-[0.12em] text-white/65 sm:text-[10px] sm:tracking-[0.14em] md:ml-auto md:text-right md:text-[11px]">
            {DINGRY_SITE_CONSTRUCTION_LABEL}
          </p>
        </section>
      </div>

      <div className="mx-auto mb-2 hidden shrink-0 text-white/55 sm:mb-4 md:block" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>

      <form
        noValidate
        onSubmit={onSubmit}
        className="mx-auto w-full max-w-xs shrink-0 max-md:translate-y-10 sm:max-w-sm sm:max-md:translate-y-12 md:max-w-xl md:translate-y-0"
      >
        <label htmlFor="teaser-email" className="sr-only">
          Inscrivez-vous pour être informé
        </label>
        <div className="flex flex-col gap-2 rounded-2xl border border-white/55 bg-black/35 p-2 backdrop-blur-sm sm:flex-row sm:items-center sm:rounded-full sm:py-1 sm:pr-1 sm:pl-5">
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
              if (status !== "sending") {
                setStatus("idle");
                setMessage("");
              }
            }}
            placeholder="Inscrivez-vous pour être informé"
            className="w-full min-w-0 bg-transparent px-3 py-2.5 text-[10px] tracking-[0.12em] text-white normal-case outline-none placeholder:text-white/75 sm:flex-1 sm:px-0 sm:text-[11px] sm:tracking-[0.16em] sm:uppercase"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full shrink-0 rounded-full bg-white px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-black uppercase transition-opacity disabled:opacity-60 sm:w-auto sm:py-2"
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
        <p
          className={`mt-3 min-h-5 text-center text-[11px] tracking-[0.18em] ${status === "error" ? "text-white/55" : "text-white/85"}`}
          role="status"
        >
          {message}
        </p>
      </form>

      <div className="mt-3 flex w-full max-w-xs shrink-0 items-end justify-between gap-4 sm:max-w-sm md:max-w-none">
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
