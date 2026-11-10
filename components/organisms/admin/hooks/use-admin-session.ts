"use client";

import { useCallback, useEffect, useState } from "react";

export const DINGRY_ADMIN_SESSION_EVENT = "dingry:admin-session";

function broadcastAdminSession(authenticated: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DINGRY_ADMIN_SESSION_EVENT, { detail: { authenticated } }),
  );
}

/** Cookie session admin (sans enrôlement TOTP) — barre Alto, garde UI. */
export function useAdminSessionProbe() {
  const [booting, setBooting] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    function onSession(ev: Event) {
      const detail = (ev as CustomEvent<{ authenticated?: boolean }>).detail;
      if (typeof detail?.authenticated === "boolean") {
        setAuthenticated(detail.authenticated);
        setBooting(false);
      }
    }
    window.addEventListener(DINGRY_ADMIN_SESSION_EVENT, onSession);
    return () => window.removeEventListener(DINGRY_ADMIN_SESSION_EVENT, onSession);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        if (cancelled) return;
        setAuthenticated(response.ok);
      } catch {
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setBooting(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return { booting, authenticated, setAuthenticated };
}

export function useAdminSession() {
  const { booting, authenticated, setAuthenticated } = useAdminSessionProbe();
  const [totpCode, setTotpCodeState] = useState("");
  const [totpQr, setTotpQr] = useState("");
  const [totpEnrollment, setTotpEnrollment] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // QR d'enrôlement (local uniquement, le serveur décide).
  useEffect(() => {
    if (booting || authenticated) return;
    let cancelled = false;
    async function loadTotpQr() {
      try {
        const response = await fetch("/api/admin/totp", { cache: "no-store" });
        const data = (await response.json()) as { showEnrollment?: boolean; qrDataUrl?: string };
        if (cancelled) return;
        const show = Boolean(data.showEnrollment);
        setTotpEnrollment(show);
        setTotpQr(show && typeof data.qrDataUrl === "string" ? data.qrDataUrl : "");
      } catch {
        if (!cancelled) {
          setTotpQr("");
          setTotpEnrollment(false);
        }
      }
    }
    void loadTotpQr();
    return () => {
      cancelled = true;
    };
  }, [authenticated, booting]);

  const setTotpCode = useCallback((raw: string) => {
    setTotpCodeState(raw.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 11));
  }, []);

  const login = useCallback(async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        backupCodes?: string[];
      };
      if (!response.ok) {
        setLoginError(data.error || "Code incorrect ou expiré.");
        return;
      }
      setTotpCodeState("");
      setBackupCodes(
        Array.isArray(data.backupCodes) && data.backupCodes.length > 0 ? data.backupCodes : null,
      );
      setAuthenticated(true);
      broadcastAdminSession(true);
    } catch {
      setLoginError("Connexion impossible.");
    } finally {
      setLoginLoading(false);
    }
  }, [setAuthenticated, totpCode]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* la session locale est quand même fermée */
    }
    setAuthenticated(false);
    broadcastAdminSession(false);
    setBackupCodes(null);
    setTotpCodeState("");
  }, [setAuthenticated]);

  /** Appelé quand une route admin répond 401. */
  const expire = useCallback(() => {
    setAuthenticated(false);
    broadcastAdminSession(false);
  }, [setAuthenticated]);

  const dismissBackupCodes = useCallback(() => setBackupCodes(null), []);

  return {
    booting,
    authenticated,
    totpCode,
    setTotpCode,
    totpQr,
    totpEnrollment,
    loginError,
    loginLoading,
    backupCodes,
    dismissBackupCodes,
    login,
    logout,
    expire,
  };
}
