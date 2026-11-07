"use client";

import { ADMIN_CRM_VERSION } from "@/lib/admin/crm-release";

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
  return (
    <header className="border-b border-[#1e2d45] bg-[#0a1220] px-6 py-5 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">DINGRY</h1>
          <p className="mt-0.5 text-sm text-zinc-400">CRM · version {ADMIN_CRM_VERSION}</p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-400">
          <span>{pendingOrders} à expédier</span>
          <span className="tabular-nums">{totalStock} pièces en stock</span>
          {stockPendingCount > 0 ? (
            <span className="text-amber-400/90">{stockPendingCount} stock en attente</span>
          ) : null}
          {lowStockCount > 0 ? <span className="text-[#7EB3FF]">{lowStockCount} stock bas</span> : null}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="border border-white/15 px-3 py-2 text-white/80 transition hover:border-white/40 hover:text-white"
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
