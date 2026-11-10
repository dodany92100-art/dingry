"use client";

import { FormEvent, useState } from "react";
import { DINGRY_CONTACT_EMAIL } from "@/lib/dingry-legal";

export function DingryContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Contact DINGRY — ${name.trim() || "Boutique"}`);
    const body = encodeURIComponent(
      `Nom : ${name.trim()}\nE-mail : ${email.trim()}\n\n${message.trim()}`,
    );
    window.location.href = `mailto:${DINGRY_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <div
      className="dingry-contact-form rounded-sm border border-black/10 bg-white/[0.92] p-5 shadow-[0_12px_40px_rgb(0_0_0/0.08)] md:p-6"
      aria-labelledby="dingry-contact-form-title"
    >
      <div className="mb-4">
        <div>
          <p id="dingry-contact-form-title" className="dingry-footer-eyebrow m-0 text-[#161616]/55">
            Contact
          </p>
          <p className="mt-1 text-[11px] leading-relaxed tracking-[0.08em] text-[#161616]/65">
            Une question sur une commande ou une pièce ? Écris-nous.
          </p>
        </div>
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
  );
}
