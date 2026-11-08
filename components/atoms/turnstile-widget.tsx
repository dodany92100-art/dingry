"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect, useRef, useState } from "react";

type TurnstileWidgetProps = {
  onToken: (token: string | null) => void;
  className?: string;
  /** Aligné sur le panneau checkout clair ou le fond sombre. */
  tone?: "dark" | "light";
};

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
const localBypass = !siteKey && process.env.NODE_ENV === "development";

export function TurnstileWidget({ onToken, className, tone = "dark" }: TurnstileWidgetProps) {
  const isLight = tone === "light";
  const [message, setMessage] = useState<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!localBypass) return;
    onTokenRef.current("developpement");
  }, [localBypass]);

  if (localBypass) return null;

  return (
    <div className={className}>
      <p
        className={`mb-3 text-[10px] tracking-[0.28em] uppercase ${
          isLight ? "text-[#0e1118]/45" : "text-white/40"
        }`}
      >
        Vérification
      </p>
      <div
        className={`overflow-x-auto border p-3 ${
          isLight ? "border-[#0e1118]/12 bg-white" : "border-white/10 bg-[#050505]"
        }`}
      >
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
              theme: isLight ? "light" : "dark",
              size: "flexible",
              language: "fr",
              action: "checkout",
              appearance: "always",
              retry: "auto",
            }}
          />
        ) : (
          <p
            className={`py-4 text-center text-[11px] leading-relaxed tracking-wide ${
              isLight ? "text-[#0e1118]/55" : "text-white/50"
            }`}
          >
            Ajoute{" "}
            <span className={isLight ? "text-[#0e1118]/85" : "text-white/80"}>
              NEXT_PUBLIC_TURNSTILE_SITE_KEY
            </span>{" "}
            pour activer le paiement.
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
