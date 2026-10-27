import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { listOrders } from "@/lib/admin/orders";
import { upsertOrder } from "@/lib/admin/store";
import { isOrderStatus, nextOrderStatus } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const orders = await listOrders();
  const current = orders.find((order) => order.id === id);
  if (!current) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  let requestedStatus: string | undefined;
  try {
    const body = (await request.json()) as { status?: unknown };
    requestedStatus = typeof body.status === "string" ? body.status : undefined;
  } catch {
    requestedStatus = undefined;
  }

  const status = requestedStatus && isOrderStatus(requestedStatus)
    ? requestedStatus
    : nextOrderStatus(current.status);

  const order = await upsertOrder({ ...current, status });
  return NextResponse.json({ order });
}
