import { NextResponse } from "next/server";
import { upsertOrder } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";
import { isPayPalOrderId } from "@/lib/paypal-order-id";

type OrderPayload = {
  orderId: string;
  payerName: string;
  email: string;
  total: number;
  items: string[];
  shippingName?: string;
  shippingAddress?: string;
};

function isNonEmptyString(value: unknown, maxLen: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLen;
}

function isOptionalString(value: unknown, maxLen: number): boolean {
  return value === undefined || (typeof value === "string" && value.length <= maxLen);
}

function isOrderPayload(value: unknown): value is OrderPayload {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const emailOk = email.length === 0 || email === "—" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const orderId = typeof record.orderId === "string" ? record.orderId.trim() : "";
  return (
    isPayPalOrderId(orderId) &&
    isNonEmptyString(record.payerName, 120) &&
    emailOk &&
    email.length <= 180 &&
    typeof record.total === "number" &&
    Number.isFinite(record.total) &&
    record.total > 0 &&
    record.total < 100000 &&
    Array.isArray(record.items) &&
    record.items.length > 0 &&
    record.items.length <= 50 &&
    record.items.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= 180) &&
    isOptionalString(record.shippingName, 120) &&
    isOptionalString(record.shippingAddress, 280)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }
  if (!isOrderPayload(body)) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  const shippingName = body.shippingName?.trim();
  const shippingAddress = body.shippingAddress?.trim();

  const order: AdminOrder = {
    id: body.orderId.trim(),
    customerName: body.payerName.trim(),
    email: body.email.trim() || "—",
    total: Math.round(body.total * 100) / 100,
    items: body.items.map((item) => item.trim()),
    status: "En attente",
    createdAt: new Date().toISOString(),
    source: "paypal",
    ...(shippingName ? { shippingName } : {}),
    ...(shippingAddress ? { shippingAddress } : {}),
  };

  await upsertOrder(order);
  return NextResponse.json({ ok: true });
}
