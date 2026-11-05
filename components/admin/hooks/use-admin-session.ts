"use client";

import { useCallback, useEffect, useState } from "react";

export function useAdminSession() {
  const [booting, setBooting] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [totpCode, setTotpCodeState] = useState("");
  const [totpQr, setTotpQr] = useState("");
  const [totpEnrollment, setTotpEnrollment] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // Session existante ?
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
    } catch {
      setLoginError("Connexion impossible.");
    } finally {
      setLoginLoading(false);
    }
  }, [totpCode]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* la session locale est quand même fermée */
    }
    setAuthenticated(false);
    setBackupCodes(null);
    setTotpCodeState("");
  }, []);

  /** Appelé quand une route admin répond 401. */
  const expire = useCallback(() => setAuthenticated(false), []);

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
