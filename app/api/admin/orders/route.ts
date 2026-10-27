import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { listOrders } from "@/lib/admin/orders";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les commandes." }, { status: 500 });
  }
}
