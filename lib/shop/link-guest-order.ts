import { customerEmailUsable, normalizeCustomerEmail } from "@/lib/auth/customer-email";
import { findOrder, loadStoreReadOnly, patchOrder } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";
import { ensureSupabaseUserForGuestCheckout } from "@/lib/supabase/guest-user";
import { deferAfter } from "@/lib/defer-after";

function orderEmailMatches(order: AdminOrder, email: string): boolean {
  if (!customerEmailUsable(order.email)) return false;
  return normalizeCustomerEmail(order.email) === email;
}

async function backfillOrdersSupabaseUserId(userId: string, email: string): Promise<void> {
  const store = await loadStoreReadOnly();
  const targets = store.orders.filter(
    (order) =>
      order.source === "paypal" &&
      !order.supabaseUserId &&
      orderEmailMatches(order, email),
  );
  await Promise.all(
    targets.map((order) =>
      patchOrder(order.id, () => ({
        supabaseUserId: userId,
      })),
    ),
  );
}

/** Rattache la commande PayPal à un compte Supabase (création invitée si besoin). */
export async function linkGuestPayPalOrder(
  orderId: string,
  payerEmail: string,
  payerName: string,
): Promise<void> {
  if (!customerEmailUsable(payerEmail)) return;

  const ensured = await ensureSupabaseUserForGuestCheckout(payerEmail, payerName);
  if (!ensured.ok) return;

  const { userId } = ensured;
  const normalizedEmail = normalizeCustomerEmail(payerEmail);
  if (!normalizedEmail) return;

  await patchOrder(orderId, (current) => {
    const patch: Partial<AdminOrder> = {};
    if (current.supabaseUserId !== userId) {
      patch.supabaseUserId = userId;
    }
    if (!customerEmailUsable(current.email)) {
      patch.email = normalizedEmail;
    }
    return patch;
  });

  await backfillOrdersSupabaseUserId(userId, normalizedEmail);
}

export function scheduleGuestPayPalAccountLink(
  orderId: string,
  payerEmail: string,
  payerName: string,
): void {
  deferAfter(() => {
    void (async () => {
      try {
        const order = await findOrder(orderId);
        if (order?.supabaseUserId && customerEmailUsable(order.email)) return;
        await linkGuestPayPalOrder(orderId, payerEmail, payerName);
      } catch (error) {
        console.error("[guest-order-link] exception", {
          orderId,
          issue: error instanceof Error ? error.message : "erreur",
        });
      }
    })();
  });
}
