"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { DINGRY_CONTACT_EMAIL } from "@/lib/dingry-legal";
import { useTranslation } from "@/hooks/use-translation";
import { formatMessage } from "@/lib/i18n/messages";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type DingryNewsletterFormProps = {
  /** Bloc footer : titres et champ email centrés dans la colonne. */
  align?: "start" | "center";
};

export function DingryNewsletterForm({ align = "start" }: DingryNewsletterFormProps) {
  const { t } = useTranslation();
  const centered = align === "center";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) return;
    const subject = encodeURIComponent(t("newsletter.mailtoSubject"));
    const body = encodeURIComponent(formatMessage(t("newsletter.mailtoBody"), { email: trimmed }));
    window.location.href = `mailto:${DINGRY_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  return (
    <div
      className={`dingry-newsletter flex w-full max-w-full flex-col ${
        centered ? "items-center text-center" : "items-start text-left"
      }`}
    >
      {status === "sent" ? (
        <p className="text-[10px] tracking-[0.1em] text-[#161616]/65" role="status">
          {t("newsletter.thanks")}
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={`flex w-full ${centered ? "justify-center" : "justify-start"}`}
        >
          <div className="dingry-newsletter-field relative w-full max-w-full sm:max-w-[22rem]">
            <label className="sr-only" htmlFor="dingry-newsletter-email-input">
              {t("newsletter.emailSrOnly")}
            </label>
            <input
              id="dingry-newsletter-email-input"
              type="email"
              name="newsletter-email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.emailPlaceholder")}
              className="dingry-contact-field dingry-newsletter-email dingry-newsletter-email--with-send dingry-newsletter-email--long-cta w-full"
            />
            <button
              type="submit"
              className="dingry-newsletter-send"
              aria-label={t("newsletter.submit")}
            >
              <ArrowRight className="dingry-newsletter-send__icon" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
