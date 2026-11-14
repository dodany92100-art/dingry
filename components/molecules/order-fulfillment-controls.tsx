"use client";

import { useState } from "react";
import { statusClass } from "@/lib/admin/format";
import { FULFILLMENT_STATUSES, type AdminOrder, type OrderStatus } from "@/lib/admin/types";

type OrderFulfillmentControlsProps = {
  order: AdminOrder;
  busy: boolean;
  onCycle: () => void;
  onSetStatus: (status: OrderStatus) => void;
  onSaveTracking: (trackingNumber: string) => void;
  onResendConfirmation?: () => void;
};

export function OrderFulfillmentControls({
  order,
  busy,
  onCycle,
  onSetStatus,
  onSaveTracking,
  onResendConfirmation,
}: OrderFulfillmentControlsProps) {
  const [trackingDraft, setTrackingDraft] = useState(order.trackingNumber ?? "");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCycle}
          className={`h-9 px-3 text-[11px] uppercase tracking-[0.16em] border ${statusClass(order.status)} disabled:opacity-40`}
        >
          {order.status}
        </button>
        {FULFILLMENT_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy || order.status === status}
            onClick={() => onSetStatus(status)}
            className="h-8 border border-white/15 px-2 text-[9px] uppercase tracking-[0.14em] text-white/60 disabled:opacity-30"
          >
            {status}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={trackingDraft}
          disabled={busy}
          onChange={(event) => setTrackingDraft(event.target.value)}
          placeholder="N° de suivi"
          className="min-w-[12rem] flex-1 border border-white/15 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/30"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => onSaveTracking(trackingDraft.trim())}
          className="h-9 border border-white/20 px-3 text-[10px] uppercase tracking-[0.16em] text-white/80 disabled:opacity-40"
        >
          Suivi
        </button>
        {order.trackingNumber ? (
          <span className="text-[10px] text-white/45">Actuel · {order.trackingNumber}</span>
        ) : null}
      </div>
      {onResendConfirmation && order.source === "paypal" ? (
        <button
          type="button"
          disabled={busy}
          onClick={onResendConfirmation}
          className="h-8 border border-emerald-500/35 px-3 text-[9px] uppercase tracking-[0.14em] text-emerald-200/90 disabled:opacity-40"
        >
          Renvoyer confirmation
        </button>
      ) : null}
    </div>
  );
}
