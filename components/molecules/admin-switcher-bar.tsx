"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useAdminSessionProbe } from "@/components/organisms/admin/hooks/use-admin-session";
import {
  buildRelativeUrl,
  isAdminAppPath,
  readAltoLastPublicUrl,
  saveAltoLastPublicUrl,
} from "@/lib/alto-last-public-url";

export function AdminSwitcherBar() {
  const { booting, authenticated } = useAdminSessionProbe();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const onAdmin = isAdminAppPath(pathname);

  const publicHref = useMemo(
    () => buildRelativeUrl(pathname, searchParams.toString()),
    [pathname, searchParams],
  );

  const onSwitch = useCallback(() => {
    if (onAdmin) {
      router.push(readAltoLastPublicUrl());
      return;
    }
    saveAltoLastPublicUrl(publicHref);
    router.push("/admin");
  }, [onAdmin, publicHref, router]);

  const label = onAdmin ? "Retour boutique" : "CRM admin";
  const hint = onAdmin
    ? "Revenir à la dernière page boutique mémorisée"
    : "Ouvrir le panneau d'administration";

  if (booting || !authenticated) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onSwitch}
      aria-label={hint}
      title={hint}
      className="fixed bottom-6 right-6 z-50 flex max-w-[min(100vw-3rem,14rem)] items-center gap-2.5 rounded-full border border-white/10 bg-[#0a0c10]/88 px-4 py-2.5 text-left shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md transition-[transform,background-color] duration-200 hover:bg-[#12151c]/95 active:scale-[0.97]"
    >
      <span
        className="relative flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]"
        aria-hidden
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">
          Alto
        </span>
        <span className="block truncate text-[11px] font-medium uppercase tracking-[0.14em] text-white/90">
          {label}
        </span>
      </span>
    </button>
  );
}
