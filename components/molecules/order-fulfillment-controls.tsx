"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { openShippingLabelPreview, printShippingLabel } from "@/lib/admin/print-shipping-label";
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

const PILL =
  "rounded-full border transition disabled:opacity-40 disabled:cursor-not-allowed";

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
    <div className="dingry-admin-track-linear space-y-2.5 rounded-2xl p-2 text-left sm:space-y-3 sm:rounded-3xl sm:p-2.5">
      <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCycle}
          className={`${PILL} h-8 px-3 text-[10px] font-medium uppercase tracking-[0.14em] sm:h-9 ${statusClass(order.status)}`}
        >
          {order.status}
        </button>
        {FULFILLMENT_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy || order.status === status}
            onClick={() => onSetStatus(status)}
            className={`${PILL} h-8 border-white/12 px-2.5 text-[9px] uppercase tracking-[0.12em] text-white/55 hover:border-white/20 hover:text-white/75 disabled:opacity-30`}
          >
            {status}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input
          type="text"
          value={trackingDraft}
          disabled={busy}
          onChange={(event) => setTrackingDraft(event.target.value)}
          placeholder="N° de suivi"
          className="dingry-admin-track-linear h-9 min-w-[10rem] flex-1 rounded-full border border-white/12 bg-black/35 px-3 text-xs text-white placeholder:text-white/30 focus:border-white/18 focus:outline-none sm:min-w-[12rem]"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => onSaveTracking(trackingDraft.trim())}
          className={`${PILL} h-9 shrink-0 border-white/16 px-3 text-[10px] uppercase tracking-[0.14em] text-white/80 hover:border-white/22`}
        >
          Suivi
        </button>
        {order.trackingNumber ? (
          <span className="w-full text-right text-[10px] text-white/45 sm:w-auto">
            Actuel · {order.trackingNumber}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void openShippingLabelPreview(order)}
          className={`${PILL} h-8 border-violet-400/35 px-3 text-[9px] uppercase tracking-[0.14em] text-violet-200/90 hover:border-violet-400/50`}
        >
          Étiquette envoi
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void printShippingLabel(order)}
          title="Imprimer l’étiquette d’expédition"
          className={`${PILL} inline-flex h-8 items-center gap-1.5 border border-cyan-400/55 bg-cyan-500/12 px-2.5 text-[9px] uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.12)] hover:border-cyan-400/70`}
        >
          <Printer size={13} strokeWidth={1.75} aria-hidden className="shrink-0" />
          Imprimer
        </button>
        {onResendConfirmation && order.source === "paypal" ? (
          <button
            type="button"
            disabled={busy}
            onClick={onResendConfirmation}
            className={`${PILL} h-8 border-emerald-500/35 px-3 text-[9px] uppercase tracking-[0.14em] text-emerald-200/90 hover:border-emerald-500/50`}
          >
            Renvoyer confirmation
          </button>
        ) : null}
      </div>
    </div>
  );
}