import { DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import { cn } from "@/lib/utils";

type AdminCrmPassageProps = {
  status?: string;
  className?: string;
};

/** Marque DINGRY + ligne street (Anton) — loader admin / passage authenticator. */
export function AdminCrmPassage({ status, className }: AdminCrmPassageProps) {
  return (
    <div className={cn("dingry-brand-reveal flex flex-col items-center text-center", className)}>
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">DINGRY</p>
      <p className="dingry-typo-street dingry-typo-street--sm mt-4 text-white/[0.88]">{DINGRY_STREET_LINE}</p>
      {status ? (
        <p className="mt-6 text-[10px] uppercase tracking-[0.32em] text-white/32">{status}</p>
      ) : null}
    </div>
  );
}
