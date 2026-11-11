"use client";

import { FormEvent, useState } from "react";
import { DINGRY_CONTACT_EMAIL } from "@/lib/dingry-legal";

type DingryContactModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DingryContactModal({ open, onClose }: DingryContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Contact DINGRY — ${name.trim() || "Boutique"}`);
    const body = encodeURIComponent(
      `Nom : ${name.trim()}\nE-mail : ${email.trim()}\n\n${message.trim()}`,
    );
    window.location.href = `mailto:${DINGRY_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8">
      <div className="dingry-legal-overlay absolute inset-0 bg-[#050505]/92" onClick={onClose} />
      <div
        className="dingry-legal-panel relative z-10 w-full max-w-md border border-white/[0.08] bg-[#0a0a0a] p-6 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dingry-contact-modal-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="dingry-section-eyebrow">Contact</p>
            <h2 id="dingry-contact-modal-title" className="mt-2 text-lg font-bold uppercase tracking-wide text-white">
              Écris-nous
            </h2>
            <p className="mt-2 text-xs leading-relaxed tracking-[0.06em] text-white/45">
              Une question sur une commande ou une pièce ? Le formulaire ouvre votre messagerie.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-white/40 transition-colors hover:text-white"
            aria-label="Fermer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="sr-only">Nom</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom"
              className="dingry-contact-field w-full"
            />
          </label>
          <label className="block">
            <span className="sr-only">E-mail</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="dingry-contact-field w-full"
            />
          </label>
          <label className="block">
            <span className="sr-only">Message</span>
            <textarea
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message"
              required
              rows={4}
              className="dingry-contact-field dingry-contact-field--area w-full resize-y"
            />
          </label>
          <button type="submit" className="dingry-contact-submit w-full">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
