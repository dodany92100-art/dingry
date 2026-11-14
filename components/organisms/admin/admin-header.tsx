"use client";

import { ExternalLink, Power } from "lucide-react";
import { formatCrmBuildLabel } from "@/lib/admin/crm-build-label";
import { adminCrmVersion } from "@/lib/admin/crm-version";

type AdminHeaderProps = {
  pendingOrders: number;
  stockPendingCount: number;
  lowStockCount: number;
  totalStock: number;
  onLogout: () => void;
  onOpenChangelog?: () => void;
};

export function AdminHeader({
  pendingOrders,
  stockPendingCount,
  lowStockCount,
  totalStock,
  onLogout,
  onOpenChangelog,
}: AdminHeaderProps) {
  const deployedAt = formatCrmBuildLabel();
  const version = adminCrmVersion();

  return (
    <header className="dingry-admin-glass dingry-admin-header sticky top-0 z-30 border-b-0 border-white/10 px-4 py-2 sm:px-6 sm:py-2.5 md:px-10 md:py-3 [--dingry-admin-header-offset:2.5rem] sm:[--dingry-admin-header-offset:2.65rem] md:[--dingry-admin-header-offset:3.25rem]">
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-x-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-x-2.5 md:gap-x-4">
          <h1 className="shrink-0 text-base font-semibold leading-none tracking-tight text-white sm:text-lg md:text-2xl">
            DINGRY
          </h1>
          {onOpenChangelog ? (
            <button
              type="button"
              onClick={onOpenChangelog}
              title="Journal des versions CRM depuis v1"
              className="hidden shrink-0 rounded-full border border-transparent px-1.5 py-0.5 text-left text-[10px] text-zinc-500 transition hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-300 sm:inline md:text-sm"
            >
              CRM v{version}
              {deployedAt ? (
                <>
                  {" "}
                  · maj.{" "}
                  <time dateTime={process.env.NEXT_PUBLIC_CRM_BUILD_AT} className="text-zinc-400">
                    {deployedAt}
                  </time>
                </>
              ) : null}
            </button>
          ) : (
            <span className="hidden shrink-0 text-[10px] text-zinc-500 sm:inline md:text-sm">
              CRM v{version}
              {deployedAt ? (
                <>
                  {" "}
                  · maj.{" "}
                  <time dateTime={process.env.NEXT_PUBLIC_CRM_BUILD_AT} className="text-zinc-400">
                    {deployedAt}
                  </time>
                </>
              ) : null}
            </span>
          )}
          {onOpenChangelog ? (
            <button
              type="button"
              onClick={onOpenChangelog}
              className="shrink-0 rounded-full border border-transparent px-1 py-0.5 text-[10px] text-zinc-500 transition hover:border-white/15 hover:text-zinc-300 sm:hidden"
            >
              v{version} · journal
            </button>
          ) : (
            <span className="shrink-0 text-[10px] text-zinc-500 sm:hidden">v{version}</span>
          )}
          <span className="shrink-0 whitespace-nowrap text-[10px] text-zinc-400 sm:text-[11px] md:text-sm">
            {pendingOrders} <span className="text-zinc-500">exp.</span>
          </span>
          <span className="shrink-0 whitespace-nowrap tabular-nums text-[10px] text-zinc-400 sm:text-[11px] md:text-sm">
            {totalStock} <span className="text-zinc-500">stk</span>
          </span>
          {stockPendingCount > 0 ? (
            <span className="shrink-0 whitespace-nowrap text-[10px] text-amber-400/90 sm:text-[11px]">
              {stockPendingCount} att.
            </span>
          ) : null}
          {lowStockCount > 0 ? (
            <span className="shrink-0 whitespace-nowrap text-[10px] text-[#ffab73] sm:text-[11px]">
              {lowStockCount} bas
            </span>
          ) : null}
          <a
            href="/websitedx"
            target="_blank"
            rel="noreferrer"
            className="dingry-admin-preview-link dingry-shimmer-logo-img dingry-gpu-layer relative inline-flex h-7 shrink-0 items-center gap-1 overflow-hidden rounded-full border border-white/12 bg-white/[0.04] px-2 text-[10px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-white/10 backdrop-blur-md sm:h-8 sm:px-2.5 md:h-9 md:gap-1.5 md:px-3.5 md:text-[12px]"
          >
            <span className="dingry-shimmer-logo relative z-[1] md:hidden">Vitrine</span>
            <span className="dingry-shimmer-logo relative z-[1] hidden md:inline">Aperçu du site</span>
            <ExternalLink
              size={13}
              strokeWidth={1.75}
              className="dingry-admin-preview-link__icon relative z-[1] shrink-0 text-white/55 transition-colors duration-300"
              aria-hidden
            />
          </a>
        </div>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Déconnexion"
          title="Déconnexion"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/65 ring-1 ring-white/10 transition hover:border-white/25 hover:text-white md:h-9 md:w-auto md:gap-1.5 md:px-3 md:text-[12px] md:font-medium"
        >
          <Power size={15} strokeWidth={1.75} className="shrink-0" aria-hidden />
          <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
