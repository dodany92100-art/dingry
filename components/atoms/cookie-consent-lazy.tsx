"use client";

import dynamic from "next/dynamic";

export const CookieConsentLazy = dynamic(
  () => import("@/components/atoms/cookie-consent").then((m) => ({ default: m.CookieConsent })),
  { ssr: false },
);
