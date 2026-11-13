"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { buildRelativeUrl } from "@/lib/alto-last-public-url";
import { getAuthCallbackOrigin } from "@/lib/auth/auth-callback-origin";
import { getSupabaseBrowser, isSupabaseBrowserAuthEnabled } from "@/lib/supabase/browser";
import { isSupabaseOAuthProviderEnabled } from "@/lib/supabase/oauth-flags";
import { mapShopAuthError } from "@/lib/auth/map-auth-error";
import { ShopOrderHistory } from "@/components/molecules/shop-order-history";
import { DRAWER_PANEL_SPRING, MODAL_OVERLAY_TRANSITION } from "@/components/organisms/shop/motion";
import { useShopOrders } from "@/hooks/use-shop-orders";
import { isFulfillmentOwnerClient } from "@/lib/shop/fulfillment-owner-client";
import Link from "next/link";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
  /** Sous-titre contextuel (wishlist, atelier…). */
  reason?: string;
  /** Session boutique — affiche « Mon compte » au lieu du formulaire login. */
  accountUser?: { email: string | undefined } | null;
  accessToken?: string | null;
  onSignOut?: () => Promise<void>;
};

type AuthView = "password" | "magic";

function authCallbackUrl(): string {
  if (typeof window === "undefined") return "/auth/callback";
  const next = buildRelativeUrl(window.location.pathname, window.location.search);
  const url = new URL("/auth/callback", getAuthCallbackOrigin() || window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

function SocialMark({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
      {children}
    </span>
  );
}

export function AuthModal({
  open,
  onClose,
  onAuthenticated,
  reason,
  accountUser,
  accessToken,
  onSignOut,
}: AuthModalProps) {
  const configured = isSupabaseBrowserAuthEnabled();
  const googleOAuth = isSupabaseOAuthProviderEnabled("google");
  const showSocial = googleOAuth;
  const [view, setView] = useState<AuthView>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState<"google" | "password" | "magic" | "signup" | "signout" | null>(null);
  const isAccountView = Boolean(accountUser?.email);
  const shopOrders = useShopOrders(accessToken, open && isAccountView);
  const showFulfillmentLink = isAccountView && isFulfillmentOwnerClient(accountUser?.email);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setMagicSent(false);
    setView("password");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  async function oauthGoogle() {
    const client = getSupabaseBrowser();
    if (!client) {
      setError("Connexion indisponible : Supabase non configuré.");
      return;
    }
    setError(null);
    setBusy("google");
    const redirectTo = authCallbackUrl();
    const { data, error: oauthError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) {
      setBusy(null);
      setError(mapShopAuthError(oauthError.message));
      return;
    }
    if (data.url) {
      window.location.assign(data.url);
      return;
    }
    setBusy(null);
    setError("Impossible d’ouvrir la connexion. Réessayez.");
  }

  async function onSignOutClick() {
    if (!onSignOut) return;
    setError(null);
    setBusy("signout");
    try {
      await onSignOut();
      onClose();
    } catch {
      setError("La déconnexion n’a pas abouti. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  async function onPasswordSubmit(event: FormEvent) {
    event.preventDefault();
    const client = getSupabaseBrowser();
    if (!client) {
      setError("Connexion indisponible : Supabase non configuré.");
      return;
    }
    const mail = email.trim();
    if (!mail || password.length < 6) {
      setError("Saisissez un e-mail valide et un mot de passe (6 caractères minimum).");
      return;
    }
    setError(null);
    setBusy("password");
    const { error: signInError } = await client.auth.signInWithPassword({ email: mail, password });
    setBusy(null);
    if (signInError) {
      setError(mapShopAuthError(signInError.message));
      return;
    }
    onAuthenticated?.();
    onClose();
  }

  async function onMagicSubmit(event: FormEvent) {
    event.preventDefault();
    const client = getSupabaseBrowser();
    if (!client) {
      setError("Connexion indisponible : Supabase non configuré.");
      return;
    }
    const mail = email.trim();
    if (!mail) {
      setError("Saisissez votre adresse e-mail.");
      return;
    }
    setError(null);
    setBusy("magic");
    const { error: otpError } = await client.auth.signInWithOtp({
      email: mail,
      options: { emailRedirectTo: authCallbackUrl() },
    });
    setBusy(null);
    if (otpError) {
      setError(mapShopAuthError(otpError.message));
      return;
    }
    setMagicSent(true);
  }

  async function onSignUp() {
    const client = getSupabaseBrowser();
    if (!client) {
      setError("Connexion indisponible : Supabase non configuré.");
      return;
    }
    const mail = email.trim();
    if (!mail || password.length < 6) {
      setError("Saisissez un e-mail et un mot de passe (6 caractères minimum).");
      return;
    }
    setError(null);
    setBusy("signup");
    const { error: signUpError } = await client.auth.signUp({
      email: mail,
      password,
      options: { emailRedirectTo: authCallbackUrl() },
    });
    setBusy(null);
    if (signUpError) {
      setError(mapShopAuthError(signUpError.message));
      return;
    }
    setError(null);
    setMagicSent(true);
  }

  const inputClass =
    "w-full rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/35";

  return (
    <AnimatePresence>
      {open ? (
        <div key="dingry-auth-modal" className="fixed inset-0 z-[75] flex justify-end">
          <motion.button
            type="button"
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_OVERLAY_TRANSITION}
            aria-label="Fermer"
            onClick={() => {
              if (!busy) onClose();
            }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="dingry-auth-title"
            className="dingry-auth-drawer relative z-10 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0a0a0a] text-white shadow-[-24px_0_80px_rgba(0,0,0,0.5)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={DRAWER_PANEL_SPRING}
          >
            <div className="dingry-gold-rule-bottom flex items-start justify-between gap-4 p-8">
              <div className={isAccountView ? "dingry-auth-account" : undefined}>
                <p
                  className={
                    isAccountView
                      ? "dingry-auth-account-eyebrow"
                      : "text-[10px] tracking-[0.32em] text-white/35 uppercase"
                  }
                >
                  Espace client
                </p>
                <h2
                  id="dingry-auth-title"
                  className={
                    isAccountView
                      ? "dingry-auth-account-title mt-2"
                      : "mt-2 text-sm font-bold tracking-[0.28em] uppercase"
                  }
                >
                  {isAccountView ? "Mon compte" : "Connexion"}
                </h2>
                {reason ? (
                  <p className="mt-3 max-w-xs text-[11px] leading-relaxed tracking-wide text-white/45">{reason}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={Boolean(busy)}
                className="flex h-10 w-10 items-center justify-center text-white/40 transition-colors hover:text-white disabled:opacity-40"
                aria-label="Fermer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-8 pb-10">
              {!configured ? (
                <p className="text-sm leading-relaxed text-white/50">
                  Configurez <span className="text-white/80">NEXT_PUBLIC_SUPABASE_URL</span> et{" "}
                  <span className="text-white/80">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> pour activer la connexion.
                </p>
              ) : isAccountView ? (
                <div className="dingry-auth-account space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <p className="dingry-auth-account-eyebrow">Connecté en tant que</p>
                    <p className="dingry-auth-account-email mt-2 break-all">{accountUser?.email}</p>
                  </div>
                  <p className="dingry-auth-account-body">
                    Vos achats PayPal invités sont rattachés à cet e-mail : reconnectez-vous pour retrouver vos
                    commandes.
                  </p>
                  {showFulfillmentLink ? (
                    <Link
                      href="/fulfillment"
                      onClick={onClose}
                      className="inline-flex rounded-full border border-white/20 px-4 py-2 text-[10px] tracking-[0.18em] text-white/80 uppercase transition-colors hover:bg-white/[0.06]"
                    >
                      Gérer les expéditions
                    </Link>
                  ) : null}
                  <div>
                    <p className="dingry-auth-account-eyebrow mb-3">Mes commandes</p>
                    <ShopOrderHistory
                      orders={shopOrders.orders}
                      loading={shopOrders.loading}
                      error={shopOrders.error}
                    />
                  </div>
                  {onSignOut ? (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void onSignOutClick()}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-3.5 text-[11px] font-medium tracking-[0.22em] text-white uppercase transition-colors hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      {busy === "signout" ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      ) : null}
                      Se déconnecter
                    </button>
                  ) : null}
                </div>
              ) : (
                <>
                  {showSocial ? (
                  <div className="space-y-3">
                    {googleOAuth ? (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void oauthGoogle()}
                      className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white py-3.5 text-[11px] font-medium tracking-[0.2em] text-[#0a0a0a] uppercase transition-opacity hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy === "google" ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
                      ) : (
                        <SocialMark>
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </SocialMark>
                      )}
                      Se connecter avec Google
                    </button>
                    ) : null}
                  </div>
                  ) : null}

                  {showSocial ? (
                  <div className="my-8 flex items-center gap-4">
                    <span className="h-px flex-1 bg-white/10" aria-hidden />
                    <span className="text-[10px] tracking-[0.28em] text-white/35 uppercase">Ou</span>
                    <span className="h-px flex-1 bg-white/10" aria-hidden />
                  </div>
                  ) : null}

                  {magicSent ? (
                    <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-relaxed text-white/70">
                      Consultez votre boîte mail : un lien de connexion vous a été envoyé à{" "}
                      <span className="text-white">{email.trim()}</span>.
                    </p>
                  ) : view === "magic" ? (
                    <form className="space-y-4" onSubmit={(e) => void onMagicSubmit(e)}>
                      <label className="block">
                        <span className="mb-2 block text-[10px] tracking-[0.24em] text-white/40 uppercase">E-mail</span>
                        <input
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputClass}
                          placeholder="vous@exemple.com"
                          disabled={busy !== null}
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={busy !== null}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 py-3.5 text-[11px] font-medium tracking-[0.22em] text-white uppercase transition-colors hover:bg-white/15 disabled:opacity-50"
                      >
                        {busy === "magic" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        ) : null}
                        Envoyer le lien magique
                      </button>
                      <button
                        type="button"
                        className="w-full py-2 text-[10px] tracking-[0.2em] text-white/45 uppercase hover:text-white"
                        onClick={() => {
                          setView("password");
                          setError(null);
                        }}
                      >
                        Mot de passe ou création de compte
                      </button>
                    </form>
                  ) : (
                    <form className="space-y-4" onSubmit={(e) => void onPasswordSubmit(e)}>
                      <label className="block">
                        <span className="mb-2 block text-[10px] tracking-[0.24em] text-white/40 uppercase">E-mail</span>
                        <input
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputClass}
                          placeholder="vous@exemple.com"
                          disabled={busy !== null}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-[10px] tracking-[0.24em] text-white/40 uppercase">
                          Mot de passe
                        </span>
                        <input
                          type="password"
                          autoComplete={remember ? "current-password" : "off"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={inputClass}
                          placeholder="••••••••"
                          disabled={busy !== null}
                        />
                      </label>
                      <label className="flex cursor-pointer items-center gap-3 text-[11px] text-white/50">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="h-4 w-4 rounded border-white/25 bg-transparent accent-white"
                        />
                        Rester connecté
                      </label>
                      <button
                        type="submit"
                        disabled={busy !== null}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-[11px] font-medium tracking-[0.22em] text-[#0a0a0a] uppercase transition-opacity hover:bg-white/90 disabled:opacity-50"
                      >
                        {busy === "password" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
                        ) : null}
                        Se connecter
                      </button>
                      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-between">
                        <button
                          type="button"
                          className="text-[10px] tracking-[0.18em] text-white/45 uppercase hover:text-white"
                          onClick={() => setView("magic")}
                        >
                          Lien de connexion unique
                        </button>
                        <button
                          type="button"
                          disabled={busy !== null}
                          className="text-[10px] tracking-[0.18em] text-white/45 uppercase hover:text-white disabled:opacity-40"
                          onClick={() => void onSignUp()}
                        >
                          {busy === "signup" ? "Création…" : "Créer un compte"}
                        </button>
                      </div>
                    </form>
                  )}

                  {error ? (
                    <p className="mt-6 text-center text-[11px] leading-relaxed text-[#ffb4b4]" role="alert">
                      {error}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
