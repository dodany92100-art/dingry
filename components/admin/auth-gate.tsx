"use client";

import type { FormEvent } from "react";

type AuthGateProps = {
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  enrollment: boolean;
  qr: string;
  error: string;
  loading: boolean;
};

export function AuthGate({ code, onCodeChange, onSubmit, enrollment, qr, error, loading }: AuthGateProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-white/10 bg-[#0a0a0a] p-8"
      >
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">CRM</p>
        <h1 className="mt-3 text-2xl font-bold tracking-[0.28em]">DINGRY</h1>
        <p className="mt-2 text-sm text-white/45">Google Authenticator ou code de secours</p>
        {enrollment ? (
          qr ? (
            <div className="mt-6 flex justify-center bg-white p-3">
              <img src={qr} alt="QR Google Authenticator DINGRY Admin" className="h-[280px] w-[280px]" />
            </div>
          ) : (
            <p className="mt-6 text-sm text-white/40">Chargement du QR…</p>
          )
        ) : null}
        <p className="mt-4 text-sm leading-relaxed text-white/45">
          {enrollment
            ? "En local uniquement : scanne ce QR une fois dans Google Authenticator, puis entre le code à 6 chiffres. Au premier succès, huit codes de secours s’affichent une seule fois."
            : "Entre le code à 6 chiffres, ou un code de secours déjà noté."}
        </p>
        <label className="mt-6 block text-[10px] uppercase tracking-[0.25em] text-white/40">
          Code
          <input
            type="text"
            autoComplete="one-time-code"
            maxLength={11}
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            required
            className="mt-2 h-11 w-full border border-white/15 bg-black px-3 text-center text-lg tracking-[0.4em] text-white outline-none focus:border-white/50"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-11 w-full bg-white text-xs font-bold uppercase tracking-[0.25em] text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {loading ? "Vérification…" : "Entrer"}
        </button>
      </form>
    </div>
  );
}
