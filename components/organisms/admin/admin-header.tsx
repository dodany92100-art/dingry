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

  return (
    <header className="dingry-admin-glass sticky top-0 z-30 border-b-0 border-white/10 px-6 py-4 md:px-10 md:py-5 [--dingry-admin-header-offset:4.25rem] md:[--dingry-admin-header-offset:5.25rem]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">DINGRY</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            CRM v{adminCrmVersion()}
            {deployedAt ? (
              <>
                {" "}
                · maj.{" "}
                <time dateTime={process.env.NEXT_PUBLIC_CRM_BUILD_AT} className="text-zinc-300">
                  {deployedAt}
                </time>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-400">
          <span>{pendingOrders} à expédier</span>
          <span className="tabular-nums">{totalStock} pièces en stock</span>
          {stockPendingCount > 0 ? (
            <span className="text-amber-400/90">{stockPendingCount} stock en attente</span>
          ) : null}
          {lowStockCount > 0 ? <span className="text-[#ffab73]">{lowStockCount} stock bas</span> : null}
          <a
            href="/websitedx"
            target="_blank"
            rel="noreferrer"
            className="dingry-admin-preview-link dingry-shimmer-logo-img dingry-gpu-layer relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-[12px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-white/10 backdrop-blur-md"
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
            className="text-white/70 transition hover:text-white"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
