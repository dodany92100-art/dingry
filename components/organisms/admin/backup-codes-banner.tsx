"use client";

type BackupCodesBannerProps = {
  codes: string[];
  onDismiss: () => void;
};

/** Affichage unique : les codes ne sont jamais renvoyés une seconde fois par le serveur. */
export function BackupCodesBanner({ codes, onDismiss }: BackupCodesBannerProps) {
  return (
    <div className="border-b border-[#FF3D00]/40 bg-[#041226] px-6 py-6 md:px-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#ff8a4d]">Codes de secours</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
        Note-les maintenant. Ils remplacent le téléphone, chacun ne sert qu’une fois, et ils ne seront plus affichés.
      </p>
      <ul className="mt-4 grid max-w-md grid-cols-2 gap-2 font-mono text-sm text-white">
        {codes.map((code) => (
          <li key={code} className="border border-white/10 bg-black px-3 py-2">
            {code}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-5 h-10 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black"
      >
        J’ai noté ces codes
      </button>
    </div>
  );
}
