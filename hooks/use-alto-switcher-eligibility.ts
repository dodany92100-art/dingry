"use client";

import { useEffect, useState } from "react";
import { isAdminAppPath } from "@/lib/alto-last-public-url";
import { isWebsitedxPath } from "@/lib/alto-switch-urls";
import { shouldClientProbeAdminSession } from "@/lib/shop-api-client-access";

type AltoState = { booting: boolean; showAlto: boolean };

export function useAltoSwitcherEligibility(pathname: string): AltoState {
  const [state, setState] = useState<AltoState>({ booting: true, showAlto: false });

  useEffect(() => {
    let cancelled = false;
    const onAdmin = isAdminAppPath(pathname);
    const onWebsitedx = isWebsitedxPath(pathname);
    const onCheckout = pathname === "/checkout" || pathname.startsWith("/checkout/");
    if (!onAdmin && !onWebsitedx && !onCheckout) {
      setState({ booting: false, showAlto: false });
      return;
    }

    async function probe() {
      try {
        if (onAdmin && !shouldClientProbeAdminSession()) {
          if (!cancelled) setState({ booting: false, showAlto: false });
          return;
        }
        const url = onAdmin ? "/api/admin/session" : "/api/shop/alto-context";
        const response = await fetch(url, { cache: "no-store" });
        if (cancelled) return;
        setState({ booting: false, showAlto: response.ok });
      } catch {
        if (!cancelled) setState({ booting: false, showAlto: false });
      }
    }

    void probe();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return state;
}