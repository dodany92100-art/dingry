"use client";

import { ADMIN_CRM_VERSION } from "@/lib/admin/crm-release";

type AdminHeaderProps = {
  pendingOrders: number;
  stockPendingCount: number;
  lowStockCount: number;
  onLogout: () => void;
};

export function AdminHeader({ pendingOrders, stockPendingCount, lowStockCount, onLogout }: AdminHeaderProps) {
  return (
    <header className="border-b border-white/[0.08] px-6 py-5 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-[0.28em]">DINGRY</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.32em] text-white/35">
            CRM v{ADMIN_CRM_VERSION}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-[11px] uppercase tracking-[0.2em] text-white/45">
          <span>{pendingOrders} à expédier</span>
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
