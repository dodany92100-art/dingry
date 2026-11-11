"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowser, isSupabaseBrowserAuthEnabled } from "@/lib/supabase/browser";

export function useShopAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const syncSession = useCallback((next: Session | null) => {
    setSession(next);
    setUser(next?.user ?? null);
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!client) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void client.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        syncSession(data.session);
        setReady(true);
      }
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      syncSession(next);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [syncSession]);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowser();
    if (!client) return;
    await client.auth.signOut();
  }, []);

  return {
    user,
    session,
    ready,
    configured: isSupabaseBrowserAuthEnabled(),
    signOut,
  };
}
