"use client";

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
    <header className="dingry-admin-glass sticky top-0 z-30 border-b-0 border-white/10 px-6 py-5 md:px-10">
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
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13px] text-white/85 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
          >
            Aperçu du site
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
