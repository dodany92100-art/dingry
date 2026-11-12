"use client";

import { FormEvent, useState } from "react";
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
      aria-labelledby="dingry-newsletter-title"
    >
      <p id="dingry-newsletter-title" className="dingry-footer-eyebrow m-0 text-[#161616]/50">
        {t("newsletter.title")}
      </p>
      <p className="mt-1.5 max-w-[18rem] text-[10px] leading-relaxed tracking-[0.06em] text-[#161616]/48">
        {t("newsletter.subtitle")}
      </p>
      {status === "sent" ? (
        <p className="mt-3 text-[10px] tracking-[0.1em] text-[#161616]/65" role="status">
          {t("newsletter.thanks")}
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={`mt-3 flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center ${
            centered ? "justify-center" : "justify-start"
          }`}
        >
          <label className="flex w-full sm:w-auto">
            <span className="sr-only">{t("newsletter.emailSrOnly")}</span>
            <input
              type="email"
              name="newsletter-email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.emailPlaceholder")}
              className="dingry-contact-field dingry-newsletter-email w-full sm:max-w-[11.25rem]"
            />
          </label>
          <button type="submit" className="dingry-contact-submit dingry-newsletter-submit w-full sm:w-auto">
            {t("newsletter.submit")}
          </button>
        </form>
      )}
    </div>
  );
}
