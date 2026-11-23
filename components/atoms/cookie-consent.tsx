"use client";

import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DINGRY_COOKIE_CONSENT_KEY,
  type DingryCookieConsent,
  readCookieConsent,
} from "@/lib/cookie-consent";
import { supportsNativeModalDialog } from "@/components/molecules/dingry-native-dialog";
import { isE2eAutomation } from "@/lib/e2e-flags";

/** Bandeau informatif : pas d’écoute `cancel` / `preventDefault` sur Échap. */
export const COOKIE_CONSENT_INTERCEPTS_DIALOG_CANCEL = false;

const DINGRY_COOKIE_NATIVE_DIALOG_CLASS =
  "fixed inset-x-0 bottom-0 z-[100] m-0 w-full max-w-none border-0 bg-transparent p-0 open:block";

/** Ouvre le bandeau natif en mode non modal (`show`, sans top layer bloquant). */
export function openNativeCookieConsentDialog(dialog: HTMLDialogElement): void {
  if (!dialog.open) {
    dialog.show();
  }
}

export function closeNativeCookieConsentDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) {
    dialog.close();
  }
}

function CookieConsentPanel({
  onChoose,
  onPolicyLinkClick,
}: {
  onChoose: (value: DingryCookieConsent) => void;
  onPolicyLinkClick: () => void;
}) {
  return (
    <div className="dingry-gold-rule-top bg-[#0a0a0a]/95 px-4 py-4 md:px-8 md:py-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="min-w-0">
          <p
            id="dingry-cookie-title"
            className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#FF3D00]"
          >
            Cookies DINGRY
          </p>
          <p id="dingry-cookie-desc" className="mt-2 text-xs leading-relaxed text-white/80 md:text-sm">
            Nous utilisons des cookies essentiels au fonctionnement du site et, si vous acceptez, des cookies de mesure
            d&apos;audience (Vercel Analytics) pour améliorer l&apos;expérience. Refuser n&apos;empêche pas la navigation
            ni les commandes.
          </p>
          <Link
            href="/#mentions-legales"
            className="mt-2 inline-block text-[10px] uppercase tracking-[0.2em] text-white/80 underline-offset-4 transition-colors hover:text-[#ff8a4d] hover:underline"
            onClick={onPolicyLinkClick}
          >
            Politique de confidentialité
          </Link>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => onChoose("rejected")}
            className="h-10 border border-white/15 px-5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/65 transition-colors hover:border-white/35 hover:text-white"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => onChoose("accepted")}
            className="h-10 bg-[#FF3D00] px-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-black transition-colors hover:bg-[#e03500]"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

function LegacyCookieBanner({
  visible,
  onChoose,
  onPolicyLinkClick,
}: {
  visible: boolean;
  onChoose: (value: DingryCookieConsent) => void;
  onPolicyLinkClick: () => void;
}) {
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="dingry-cookie-title"
      aria-describedby="dingry-cookie-desc"
      className="dingry-gold-rule-top fixed inset-x-0 bottom-0 z-[100]"
    >
      <CookieConsentPanel onChoose={onChoose} onPolicyLinkClick={onPolicyLinkClick} />
    </div>
  );
}

export function CookieConsent() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [visible, setVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nativeModal = supportsNativeModalDialog();

  useEffect(() => {
    if (isAdmin || isE2eAutomation()) return;
    const stored = readCookieConsent();
    if (stored === "accepted") {
      setAnalyticsEnabled(true);
    }
    if (!stored) {
      setVisible(true);
    }
  }, [isAdmin]);

  const choose = useCallback((value: DingryCookieConsent) => {
    localStorage.setItem(DINGRY_COOKIE_CONSENT_KEY, value);
    setVisible(false);
    if (value === "accepted") {
      setAnalyticsEnabled(true);
    }
    if (nativeModal) {
      const dialog = dialogRef.current;
      if (dialog) closeNativeCookieConsentDialog(dialog);
    }
  }, [nativeModal]);

  const hideForPolicyLink = useCallback(() => {
    setVisible(false);
    if (nativeModal) {
      const dialog = dialogRef.current;
      if (dialog) closeNativeCookieConsentDialog(dialog);
    }
  }, [nativeModal]);

  useEffect(() => {
    if (!nativeModal || isAdmin) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (visible) {
      openNativeCookieConsentDialog(dialog);
    } else {
      closeNativeCookieConsentDialog(dialog);
    }
  }, [visible, nativeModal, isAdmin]);

  if (isAdmin) {
    return null;
  }

  return (
    <>
      {process.env.NODE_ENV === "production" && analyticsEnabled ? <Analytics /> : null}
      {nativeModal ? (
        <dialog
          ref={dialogRef}
          aria-labelledby="dingry-cookie-title"
          aria-describedby="dingry-cookie-desc"
          className={DINGRY_COOKIE_NATIVE_DIALOG_CLASS}
        >
          {visible ? <CookieConsentPanel onChoose={choose} onPolicyLinkClick={hideForPolicyLink} /> : null}
        </dialog>
      ) : (
        <LegacyCookieBanner visible={visible} onChoose={choose} onPolicyLinkClick={hideForPolicyLink} />
      )}
    </>
  );
}