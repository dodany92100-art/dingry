"use client";

import { useState, type FormEvent } from "react";
import { DINGRY_LOGO_URL } from "@/lib/dingry-brand";
import { DINGRY_COUNTDOWN_LABEL, DINGRY_TEASER_MESSAGE } from "@/lib/dingry-countdown";

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

type TeaserProps = {
  displayClassName: string;
};

const TEASER_MESSAGE_PAD_CLASS =
  "m-0 w-full max-w-md rounded-lg bg-black/40 px-4 py-3 text-pretty text-left text-sm leading-relaxed tracking-normal text-white backdrop-blur-sm normal-case sm:text-[0.95rem] md:text-base";
const TEASER_MESSAGE_PAD_MOBILE_CLASS =
  "max-md:bg-black/20 max-md:backdrop-blur-[2px]";

function TeaserOpeningTitles({ displayClassName }: { displayClassName: string }) {
  return (
    <div className="space-y-2 text-center md:space-y-2.5">
      <p
        className={`${displayClassName} text-[10px] tracking-[0.38em] text-white/80 sm:text-[11px] sm:tracking-[0.42em]`}
      >
        OUVERTURE DU
      </p>
      <p
        className={`${displayClassName} text-[clamp(1.55rem,4.2vw,3.4rem)] leading-[0.92] tracking-[0.02em] text-white`}
      >
        SITE OFFICIEL
      </p>
    </div>
  );
}

function TeaserOpeningDateRow() {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      <span className="h-px w-6 bg-white/75 sm:w-8 md:w-10" aria-hidden />
      <p className="text-[10px] tracking-[0.24em] text-white sm:text-[11px] sm:tracking-[0.28em]">
        {DINGRY_COUNTDOWN_LABEL}
      </p>
      <span className="h-px w-6 bg-white/75 sm:w-8 md:w-10" aria-hidden />
    </div>
  );
}

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
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "saved" | "already" | "error">("idle");
  const [message, setMessage] = useState("");

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
      {/* Mobile : logo haut · ouverture à droite · desktop : grille 2 col */}
      <div className="relative flex w-full min-h-0 flex-1 flex-col md:grid md:grid-cols-2 md:items-stretch md:gap-8">
        <section
          aria-label="DINGRY Paris"
          className="relative flex min-h-0 flex-1 flex-col md:col-start-1 md:row-start-1 md:h-auto md:flex-none md:justify-self-start md:self-start"
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

        {/* Mobile : ouverture en haut à droite (tête / fumée du visuel) */}
        <section
          aria-label="Ouverture"
          className="pointer-events-none absolute top-[clamp(12.25rem,38vh,14.5rem)] -right-5 z-20 w-[min(62vw,248px)] space-y-2.5 text-center sm:-right-3 sm:top-[clamp(12.75rem,40vh,15rem)] sm:space-y-3 md:hidden"
        >
          <TeaserOpeningTitles displayClassName={displayClassName} />
          <TeaserOpeningDateRow />
        </section>

        <div className="hidden w-full flex-col items-center gap-4 text-center md:col-start-2 md:row-start-1 md:ml-auto md:mt-24 md:flex md:max-w-md md:self-start">
          <TeaserOpeningTitles displayClassName={displayClassName} />
          <TeaserOpeningDateRow />
        </div>
      </div>

      {/* Desktop : bloc message — position absolue bas droite */}
      <p
        className={`${displayClassName} ${TEASER_MESSAGE_PAD_CLASS} pointer-events-auto hidden md:absolute md:bottom-28 md:right-12 md:z-20 md:block lg:bottom-32 lg:right-16`}
      >
        {DINGRY_TEASER_MESSAGE}
      </p>

      {/* Mobile : texte au-dessus de l’e-mail (plus masqué par la barre) */}
      <p
        className={`${displayClassName} ${TEASER_MESSAGE_PAD_CLASS} ${TEASER_MESSAGE_PAD_MOBILE_CLASS} relative z-20 mb-3 w-full shrink-0 md:hidden`}
      >
        {DINGRY_TEASER_MESSAGE}
      </p>

      {/* Bloc 4 : e-mail */}
      <form
        noValidate
        onSubmit={onSubmit}
        className="relative z-20 mx-auto w-full max-w-xs shrink-0 sm:max-w-sm md:max-w-md"
      >
        <label htmlFor="teaser-email" className="sr-only">
          Inscrivez-vous pour être informé
        </label>
        <div
          className={`flex flex-row items-center gap-1 rounded-full border bg-black/35 py-1 pr-1 pl-4 backdrop-blur-sm ${
            status === "error" ? "border-white/35" : "border-white/55"
          }`}
        >
          <input
            id="teaser-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={180}
            value={email}
            aria-invalid={status === "error"}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "sending") {
                setStatus("idle");
                setMessage("");
              }
            }}
            placeholder="E-mail"
            className="min-h-9 min-w-0 flex-1 bg-transparent py-2 text-[10px] tracking-[0.12em] text-white normal-case outline-none placeholder:text-white/75 sm:text-[11px] sm:tracking-[0.16em] sm:uppercase"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-black uppercase transition-opacity disabled:opacity-60"
          >
            {status === "sending" ? "…" : "OK →"}
          </button>
        </div>
        {message ? (
          <p className="sr-only" role="status">
            {message}
          </p>
        ) : null}
        <input
          name="website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="sr-only"
        />
      </form>

      <div className="mt-3 flex w-full max-w-xs shrink-0 items-end justify-between gap-4 sm:max-w-sm md:mx-auto md:max-w-md">
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
