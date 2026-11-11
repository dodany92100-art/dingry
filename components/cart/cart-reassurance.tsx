import { DINGRY_CART_REASSURANCE_EYEBROW, DINGRY_CART_REASSURANCE_ITEMS } from "@/lib/dingry-checkout-copy";

type CartReassuranceProps = {
  tone?: "dark" | "light";
  className?: string;
};

function PaymentMarksMono({ muted }: { muted: string }) {
  return (
    <ul className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label="Moyens de paiement acceptés">
      <li
        className={`flex h-8 items-center justify-center border px-2 ${muted}`}
        title="Visa"
      >
        <svg viewBox="0 0 48 16" width="40" height="14" role="img" aria-label="Visa" className="opacity-80">
          <text
            x="0"
            y="13"
            fill="currentColor"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="13"
            fontWeight="700"
            fontStyle="italic"
            letterSpacing="0.5"
          >
            VISA
          </text>
        </svg>
      </li>
      <li
        className={`flex h-8 items-center justify-center border px-2 ${muted}`}
        title="Mastercard"
      >
        <svg viewBox="0 0 36 20" width="32" height="18" role="img" aria-label="Mastercard" className="opacity-80">
          <circle cx="14" cy="10" r="7" fill="currentColor" fillOpacity="0.45" />
          <circle cx="22" cy="10" r="7" fill="currentColor" fillOpacity="0.75" />
        </svg>
      </li>
      <li
        className={`flex h-8 items-center justify-center border px-2 ${muted}`}
        title="American Express"
      >
        <svg viewBox="0 0 52 16" width="44" height="14" role="img" aria-label="American Express" className="opacity-80">
          <text
            x="0"
            y="12"
            fill="currentColor"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.2"
          >
            AMEX
          </text>
        </svg>
      </li>
      <li
        className={`flex h-8 items-center justify-center border px-2 ${muted}`}
        title="PayPal"
      >
        <svg viewBox="0 0 56 16" width="48" height="14" role="img" aria-label="PayPal" className="opacity-80">
          <text
            x="0"
            y="13"
            fill="currentColor"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="12"
            fontWeight="700"
            fontStyle="italic"
          >
            PayPal
          </text>
        </svg>
      </li>
    </ul>
  );
}

export function CartReassurance({ tone = "dark", className = "" }: CartReassuranceProps) {
  const isLight = tone === "light";
  const border = isLight ? "border-zinc-200" : "border-white/10";
  const eyebrow = isLight ? "text-zinc-400" : "text-white/35";
  const body = isLight ? "text-zinc-600" : "text-white/50";
  const bullet = isLight ? "bg-zinc-300" : "bg-white/25";
  const payMuted = isLight ? "border-zinc-200 text-zinc-700" : "border-white/12 text-white/55";

  return (
    <aside
      className={`border-t pt-5 ${border} ${className}`}
      aria-labelledby="dingry-cart-reassurance-title"
    >
      <p id="dingry-cart-reassurance-title" className={`text-[10px] tracking-[0.28em] uppercase ${eyebrow}`}>
        {DINGRY_CART_REASSURANCE_EYEBROW}
      </p>
      <ul className={`mt-4 space-y-2.5 text-[11px] leading-relaxed tracking-wide ${body}`}>
        {DINGRY_CART_REASSURANCE_ITEMS.map((line) => (
          <li key={line} className="flex gap-3">
            <span className={`mt-[0.45rem] h-px w-3 shrink-0 ${bullet}`} aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <PaymentMarksMono muted={payMuted} />
    </aside>
  );
}
