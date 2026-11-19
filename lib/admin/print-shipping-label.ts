import QRCode from "qrcode";
import type { AdminOrder } from "@/lib/admin/types";
import { DINGRY_BRAND_NAME, DINGRY_COMPANY, DINGRY_CONTACT_EMAIL, DINGRY_CONTACT_PHONE } from "@/lib/dingry-legal";
import { formatCustomerPhoneDisplay } from "@/lib/checkout-phone";
import { formatPrice } from "@/lib/admin/format";
import {
  buildShippingLabelQrPayload,
  shippingLabelQrLines,
} from "@/lib/admin/shipping-label-qr";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderItemsList(order: AdminOrder): string {
  return shippingLabelQrLines(order)
    .map((row) => {
      const sku = row.sku
        ? `<span class="sku">${escapeHtml(row.sku)}</span>`
        : `<span class="sku sku--missing">SKU à configurer</span>`;
      return `<li><span class="line">${escapeHtml(row.line)}</span> ${sku}</li>`;
    })
    .join("");
}

/** Fenêtre d’impression — étiquette expédition (destinataire + expéditeur DINGRY + QR). */
export async function buildShippingLabelHtml(order: AdminOrder): Promise<string> {
  const recipientName = order.shippingName?.trim() || order.customerName;
  const recipientAddress = order.shippingAddress?.trim() || "Adresse manquante";
  const phone = order.customerPhone ? formatCustomerPhoneDisplay(order.customerPhone) : "—";
  const tracking = order.trackingNumber?.trim()
    ? `<p class="meta"><strong>Suivi</strong> · ${escapeHtml(order.trackingNumber)}</p>`
    : "";
  const qrPayload = buildShippingLabelQrPayload(order);
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 220,
    errorCorrectionLevel: "M",
  });

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Étiquette · ${escapeHtml(order.id)}</title>
<style>
  @page { size: 100mm 150mm; margin: 8mm; }
  body { font-family: system-ui, sans-serif; color: #111; font-size: 11px; line-height: 1.45; margin: 0; }
  .sheet { border: 1px solid #333; padding: 10px 12px; min-height: 130mm; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; }
  .brand { font-size: 13px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
  .block { border: 1px solid #999; padding: 8px 10px; border-radius: 2px; }
  .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #555; margin: 0 0 4px; }
  .to-name { font-size: 14px; font-weight: 600; margin: 0 0 6px; }
  .addr { white-space: pre-line; margin: 0; }
  ul { margin: 6px 0 0; padding-left: 0; list-style: none; }
  ul li { margin: 0 0 6px; }
  .line { display: block; }
  .sku { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; color: #222; }
  .sku--missing { color: #a65; font-weight: 500; }
  .meta { font-size: 10px; color: #444; margin: 4px 0 0; }
  .from { font-size: 10px; color: #333; }
  .qr-row { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
  .qr-row img { width: 22mm; height: 22mm; flex-shrink: 0; }
  .qr-caption { font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin: 0; line-height: 1.35; }
  @media print { body { padding: 0; } }
</style></head><body>
<div class="sheet">
  <p class="brand">${escapeHtml(DINGRY_BRAND_NAME)} · envoi</p>
  <div class="block">
    <p class="label">Destinataire</p>
    <p class="to-name">${escapeHtml(recipientName)}</p>
    <p class="addr">${escapeHtml(recipientAddress)}</p>
    <p class="meta">${escapeHtml(order.email)} · ${escapeHtml(phone)}</p>
  </div>
  <div class="block">
    <p class="label">Commande</p>
    <p class="meta">PayPal ${escapeHtml(order.id)}${order.captureId ? ` · ${escapeHtml(order.captureId)}` : ""}</p>
    <p class="meta">${escapeHtml(formatPrice(order.total))} · ${escapeHtml(order.status)}</p>
    ${tracking}
    <ul>${renderItemsList(order)}</ul>
    <div class="qr-row">
      <img src="${qrDataUrl}" alt="QR code commande DINGRY" />
      <p class="qr-caption">Scan · commande, lignes &amp; SKU<br/>${escapeHtml(order.id)}</p>
    </div>
  </div>
  <div class="from">
    <strong>Expéditeur</strong><br/>
    ${escapeHtml(DINGRY_COMPANY.legalName)} · ${escapeHtml(DINGRY_BRAND_NAME)}<br/>
    ${escapeHtml(DINGRY_COMPANY.registeredOffice)}<br/>
    ${escapeHtml(DINGRY_CONTACT_EMAIL)} · ${escapeHtml(DINGRY_CONTACT_PHONE)}
  </div>
</div>
</body></html>`;
}

async function openShippingLabelWindow(order: AdminOrder): Promise<Window | null> {
  const html = await buildShippingLabelHtml(order);
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return null;
  win.document.write(html);
  win.document.close();
  return win;
}

/** Aperçu étiquette dans un nouvel onglet (sans dialogue d’impression). */
export async function openShippingLabelPreview(order: AdminOrder): Promise<void> {
  const win = await openShippingLabelWindow(order);
  if (!win) return;
  win.focus();
}

/** Ouvre l’étiquette et lance l’impression navigateur. */
export async function printShippingLabel(order: AdminOrder): Promise<void> {
  const win = await openShippingLabelWindow(order);
  if (!win) return;
  const runPrint = () => {
    win.focus();
    win.print();
  };
  if (win.document.readyState === "complete") {
    runPrint();
  } else {
    win.addEventListener("load", runPrint, { once: true });
  }
}