"use client";

import { DingryLogo } from "@/components/atoms/dingry-logo";
import { ExternalLink, Power } from "lucide-react";
import { formatCrmBuildLabelHeaderParts } from "@/lib/admin/crm-build-label";
import { adminCrmDisplayVersion } from "@/lib/admin/crm-release";
import { useAdminShopPreview } from "@/components/organisms/admin/hooks/use-admin-shop-preview";
import { altoShopEntryUrl } from "@/lib/alto-switch-urls";

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
  const deployedAtParts = formatCrmBuildLabelHeaderParts();
  const version = adminCrmDisplayVersion();
  const { openPreview, closePreview, busy, previewUiEnabled } = useAdminShopPreview();
  const vitrineCtaClass =
    "dingry-admin-preview-link relative hidden h-7 shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] px-2 text-[10px] font-medium leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-white/10 backdrop-blur-md md:order-none md:ml-0 md:inline-flex md:h-9 md:gap-1.5 md:px-3.5 md:text-[12px]";

  return (
    <header className="dingry-admin-glass dingry-admin-header relative z-10 border-b-0 border-white/10 px-4 py-2 sm:px-6 sm:py-2.5 md:px-10 md:py-3 [--dingry-admin-header-offset:2.5rem] sm:[--dingry-admin-header-offset:2.65rem] md:[--dingry-admin-header-offset:3.25rem]">
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-2.5 md:gap-x-4 max-md:gap-y-1.5">
          <h1 className="shrink-0 leading-none">
            <DingryLogo animate={false} className="h-8 w-auto sm:h-9 md:h-10" />
          </h1>
          {onOpenChangelog ? (
            <button
              type="button"
              onClick={onOpenChangelog}
              title="Journal des versions CRM depuis v1"
              className="hidden shrink-0 rounded-full border border-transparent px-0.5 py-px font-normal text-left text-[7px] leading-none tracking-[0.02em] text-zinc-600/55 transition hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-400/90 sm:inline md:text-[8px]"
            >
              CRM v{version}
              {deployedAtParts ? (
                <>
                  <span className="text-zinc-700/40"> · </span>
                  <time
                    dateTime={process.env.NEXT_PUBLIC_CRM_BUILD_AT}
                    className="text-[6px] text-zinc-600/40 md:text-[7px]"
                  >
                    {deployedAtParts.date}
                    <span className="text-zinc-700/35"> · </span>
                    <span className="tabular-nums text-zinc-600/35">{deployedAtParts.time}</span>
                  </time>
                </>
              ) : null}
            </button>
          ) : (
            <span className="hidden shrink-0 text-[7px] font-normal leading-none tracking-[0.02em] text-zinc-600/55 sm:inline md:text-[8px]">
              CRM v{version}
              {deployedAtParts ? (
                <>
                  <span className="text-zinc-700/40"> · </span>
                  <time
                    dateTime={process.env.NEXT_PUBLIC_CRM_BUILD_AT}
                    className="text-[6px] text-zinc-600/40 md:text-[7px]"
                  >
                    {deployedAtParts.date}
                    <span className="text-zinc-700/35"> · </span>
                    <span className="tabular-nums text-zinc-600/35">{deployedAtParts.time}</span>
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
          <span className="hidden shrink-0 whitespace-nowrap text-[10px] text-zinc-400 min-[400px]:inline sm:text-[11px] md:text-sm">
            {pendingOrders} <span className="text-zinc-500">exp.</span>
          </span>
          <span className="hidden shrink-0 whitespace-nowrap tabular-nums text-[10px] text-zinc-400 min-[400px]:inline sm:text-[11px] md:text-sm">
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
          {previewUiEnabled ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void openPreview()}
                className={`${vitrineCtaClass} disabled:opacity-50`}
              >
                <span className="relative z-[1]">Ouvrir la preview</span>
                <ExternalLink
                  size={13}
                  strokeWidth={1.75}
                  className="dingry-admin-preview-link__icon relative z-[1] shrink-0 text-white/55 transition-colors duration-300"
                  aria-hidden
                />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void closePreview()}
                className="hidden shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-400 ring-1 ring-white/10 transition hover:text-white disabled:opacity-50 sm:inline md:text-[11px]"
              >
                Quitter la preview
              </button>
            </>
          ) : (
            <a
              href={altoShopEntryUrl()}
              target="_blank"
              rel="noreferrer"
              className={vitrineCtaClass}
            >
              <span className="relative z-[1]">Aperçu du site</span>
              <ExternalLink
                size={13}
                strokeWidth={1.75}
                className="dingry-admin-preview-link__icon relative z-[1] shrink-0 text-white/55 transition-colors duration-300"
                aria-hidden
              />
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Déconnexion"
          title="Déconnexion"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/65 ring-1 ring-white/10 transition hover:border-white/25 hover:text-white md:h-9 md:w-9"
        >
          <Power size={15} strokeWidth={1.75} className="shrink-0" aria-hidden />
        </button>
      </div>
    </header>
  );
}
