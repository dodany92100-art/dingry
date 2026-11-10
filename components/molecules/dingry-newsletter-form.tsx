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
    <div className="dingry-newsletter" aria-labelledby="dingry-newsletter-title">
      <p id="dingry-newsletter-title" className="dingry-footer-eyebrow m-0">
        Newsletter
      </p>
      <p className="mt-2 max-w-sm text-[11px] leading-relaxed tracking-[0.08em] text-[#161616]/65">
        Drops, atelier custom et pièces exclusives — inscris-toi.
      </p>
      {status === "sent" ? (
        <p className="mt-4 text-[11px] tracking-[0.12em] text-[#161616]/75" role="status">
          Merci. Confirme l’envoi dans ton client mail.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <label className="block min-w-0 flex-1">
            <span className="sr-only">E-mail newsletter</span>
            <input
              type="email"
              name="newsletter-email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ton e-mail"
              className="dingry-contact-field w-full"
            />
          </label>
          <button type="submit" className="dingry-contact-submit shrink-0 sm:px-6">
            S’inscrire
          </button>
        </form>
      )}
    </div>
  );
}
