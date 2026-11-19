import type { AdminOrder } from "@/lib/admin/types";

export type ShippingLabelQrLine = {
  /** Libellé affiché (ligne commande). */
  line: string;
  sku: string | null;
};

const SKU_TAIL_RE = /\s·\s*([A-Za-z0-9][\w-]*)\s*$/;
const SKU_INLINE_RE = /\b(DINGRY-[A-Z0-9]+(?:-[A-Z0-9]+)*)\b/i;

/** Extrait le SKU d’une ligne CRM (suffixe « · DINGRY-… » ou token inline). */
export function extractSkuFromOrderLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const tail = trimmed.match(SKU_TAIL_RE);
  if (tail?.[1]) return tail[1].toUpperCase();
  const inline = trimmed.match(SKU_INLINE_RE);
  return inline?.[1]?.toUpperCase() ?? null;
}

export function shippingLabelQrLines(order: AdminOrder): ShippingLabelQrLine[] {
  return order.items.map((line) => ({
    line,
    sku: extractSkuFromOrderLine(line),
  }));
}

/** Payload compact pour QR (entrepôt / scan mobile). */
export function buildShippingLabelQrPayload(order: AdminOrder): string {
  const items = shippingLabelQrLines(order).map((row) => ({
    sku: row.sku ?? "",
    line: row.line.slice(0, 160),
  }));
  return JSON.stringify({
    v: 1,
    brand: "DINGRY",
    orderId: order.id,
    captureId: order.captureId ?? null,
    tracking: order.trackingNumber?.trim() || null,
    customer: order.shippingName?.trim() || order.customerName,
    items,
  });
}