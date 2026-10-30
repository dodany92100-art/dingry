"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect, useState } from "react";

type TurnstileWidgetProps = {
  onToken: (token: string | null) => void;
  className?: string;
};

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
const localBypass = !siteKey && process.env.NODE_ENV === "development";

export function TurnstileWidget({ onToken, className }: TurnstileWidgetProps) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (localBypass) onToken("developpement");
  }, [onToken]);

  if (localBypass) return null;

  return (
    <div className={className}>
      <p className="mb-3 text-[10px] tracking-[0.28em] text-white/40 uppercase">Vérification</p>
      <div className="overflow-x-auto border border-white/10 bg-[#050505] p-3">
        {siteKey ? (
          <Turnstile
            siteKey={siteKey}
            onSuccess={(token) => {
              setMessage(null);
              onToken(token);
            }}
            onExpire={() => {
              setMessage("La vérification a expiré. Relancez le contrôle.");
              onToken(null);
            }}
            onError={() => {
              setMessage("Le contrôle anti-bot n’a pas abouti. Réessayez.");
              onToken(null);
            }}
            onTimeout={() => {
              setMessage("Le contrôle a expiré. Relancez la vérification.");
              onToken(null);
            }}
            options={{
              theme: "dark",
              size: "flexible",
              language: "fr",
              action: "checkout",
              appearance: "always",
              retry: "auto",
            }}
          />
        ) : (
          <p className="py-4 text-center text-[11px] leading-relaxed tracking-wide text-white/50">
            Ajoute <span className="text-white/80">NEXT_PUBLIC_TURNSTILE_SITE_KEY</span> pour activer le paiement.
          </p>
        )}
      </div>
      {message ? (
        <p className="mt-3 text-center text-[11px] leading-relaxed text-[#ffb4b4]" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
