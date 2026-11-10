"use client";

import { ExternalLink } from "lucide-react";
import { formatCrmBuildLabel } from "@/lib/admin/crm-build-label";
import { adminCrmVersion } from "@/lib/admin/crm-version";

type AdminHeaderProps = {
  pendingOrders: number;
  stockPendingCount: number;
  lowStockCount: number;
  totalStock: number;
  onLogout: () => void;
};

export function AdminHeader({
  pendingOrders,
  stockPendingCount,
  lowStockCount,
  totalStock,
  onLogout,
}: AdminHeaderProps) {
  const deployedAt = formatCrmBuildLabel();
  const version = adminCrmVersion();

  return (
    <header className="dingry-admin-glass dingry-admin-header sticky top-0 z-30 border-b-0 border-white/10 px-4 py-2 sm:px-6 sm:py-2.5 md:px-10 md:py-4 [--dingry-admin-header-offset:3.35rem] sm:[--dingry-admin-header-offset:3.65rem] md:[--dingry-admin-header-offset:4.75rem]">
      <div className="flex flex-col gap-1.5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
        <div className="flex min-w-0 items-start justify-between gap-2 md:block">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-none tracking-tight text-white md:text-2xl">
              DINGRY
            </h1>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-500 md:text-sm md:text-zinc-400">
              <span className="md:hidden">CRM v{version}</span>
              <span className="hidden md:inline">
                CRM v{version}
                {deployedAt ? (
                  <>
                    {" "}
                    · maj.{" "}
                    <time dateTime={process.env.NEXT_PUBLIC_CRM_BUILD_AT} className="text-zinc-300">
                      {deployedAt}
                    </time>
                  </>
                ) : null}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            <a
              href="/websitedx"
              target="_blank"
              rel="noreferrer"
              className="dingry-admin-preview-link inline-flex h-8 items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] px-2.5 text-[10px] font-medium text-white/85 ring-1 ring-white/10"
            >
              Aperçu
              <ExternalLink size={11} strokeWidth={1.75} className="text-white/50" aria-hidden />
            </a>
            <button
              type="button"
              onClick={onLogout}
              className="px-1 text-[10px] font-medium text-white/55"
            >
              Quitter
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-zinc-400 sm:text-[11px] md:gap-5 md:text-sm">
          <span className="whitespace-nowrap">
            {pendingOrders} <span className="text-zinc-500">exp.</span>
          </span>
          <span className="whitespace-nowrap tabular-nums">
            {totalStock} <span className="text-zinc-500">stk</span>
          </span>
          {stockPendingCount > 0 ? (
            <span className="whitespace-nowrap text-amber-400/90">{stockPendingCount} attente</span>
          ) : null}
          {lowStockCount > 0 ? (
            <span className="whitespace-nowrap text-[#ffab73]">{lowStockCount} bas</span>
          ) : null}
          <a
            href="/websitedx"
            target="_blank"
            rel="noreferrer"
            className="dingry-admin-preview-link dingry-shimmer-logo-img dingry-gpu-layer relative hidden h-9 items-center gap-1.5 overflow-hidden rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-[12px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-white/10 backdrop-blur-md md:inline-flex"
          >
            <span className="dingry-shimmer-logo relative z-[1]">Aperçu du site</span>
            <ExternalLink
              size={13}
              strokeWidth={1.75}
              className="dingry-admin-preview-link__icon relative z-[1] shrink-0 text-white/55 transition-colors duration-300"
              aria-hidden
            />
          </a>
          <button
            type="button"
            onClick={onLogout}
            className="hidden text-white/70 transition hover:text-white md:inline"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
