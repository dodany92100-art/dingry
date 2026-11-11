"use client";

import { FormEvent, useState } from "react";
import { DINGRY_CONTACT_EMAIL } from "@/lib/dingry-legal";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function DingryNewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) return;
    const subject = encodeURIComponent("Newsletter DINGRY");
    const body = encodeURIComponent(`Inscription newsletter : ${trimmed}`);
    window.location.href = `mailto:${DINGRY_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  return (
    <div
      className="dingry-newsletter flex w-full max-w-full flex-col items-start text-left"
      aria-labelledby="dingry-newsletter-title"
    >
      <p id="dingry-newsletter-title" className="dingry-footer-eyebrow m-0 text-[#161616]/50">
        Newsletter
      </p>
      <p className="mt-1.5 text-[10px] leading-relaxed tracking-[0.06em] text-[#161616]/48">
        Drops & exclus — inscris-toi.
      </p>
      {status === "sent" ? (
        <p className="mt-3 text-[10px] tracking-[0.1em] text-[#161616]/65" role="status">
          Merci. Confirme l’envoi dans ton client mail.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-3 flex w-full flex-col items-stretch justify-start gap-2 sm:flex-row sm:items-center sm:justify-start"
        >
          <label className="flex w-full sm:w-auto">
            <span className="sr-only">E-mail newsletter</span>
            <input
              type="email"
              name="newsletter-email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="dingry-contact-field dingry-newsletter-email w-full sm:max-w-[11.25rem]"
            />
          </label>
          <button type="submit" className="dingry-contact-submit dingry-newsletter-submit w-full sm:w-auto">
            S’inscrire
          </button>
        </form>
      )}
    </div>
  );
}
