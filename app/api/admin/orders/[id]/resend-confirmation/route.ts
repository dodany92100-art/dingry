import { requireAdmin } from "@/lib/admin/auth";
import { findOrder } from "@/lib/admin/store";
import { jsonNoStore } from "@/lib/http";
import { resendCustomerOrderConfirmation } from "@/lib/order-confirmation-resend";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const order = await findOrder(id);
  if (!order) {
    return jsonNoStore({ error: "Commande introuvable." }, { status: 404 });
  }
  if (order.source !== "paypal") {
    return jsonNoStore({ error: "Confirmation réservée aux commandes PayPal." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return jsonNoStore(
      {
        error:
          "RESEND_API_KEY absente sur ce serveur : ajoutez la clé dans .env.local (dev) ou Vercel → Environment Variables (prod), puis redémarrez.",
      },
      { status: 503 },
    );
  }

  const result = await resendCustomerOrderConfirmation(order);
  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: 502 });
  }
  return jsonNoStore({ sent: true, to: order.email.trim() });
}
