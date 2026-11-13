import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeCustomerEmail } from "@/lib/auth/customer-email";
import { isSupabaseStoreEnabled, supabaseAdmin } from "@/lib/supabase/server";

function duplicateUserError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("already") && (m.includes("registered") || m.includes("exists"));
}

async function findAuthUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[guest-user] listUsers", { message: error.message });
      return null;
    }
    const hit = data.users.find((user) => user.email?.trim().toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 20) break;
  }
  return null;
}

export type EnsureGuestUserResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "disabled" | "invalid_email" | "error" };

/**
 * Crée un compte Supabase (e-mail confirmé) ou réutilise l'existant — achat invité PayPal.
 */
export async function ensureSupabaseUserForGuestCheckout(
  rawEmail: string,
  fullName?: string,
): Promise<EnsureGuestUserResult> {
  if (!isSupabaseStoreEnabled()) return { ok: false, reason: "disabled" };
  const email = normalizeCustomerEmail(rawEmail);
  if (!email) return { ok: false, reason: "invalid_email" };

  const admin = supabaseAdmin();
  const name = fullName?.trim().slice(0, 120);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      ...(name ? { full_name: name } : {}),
      dingry_source: "guest_checkout",
    },
  });
  if (!createError && created.user?.id) {
    return { ok: true, userId: created.user.id };
  }

  if (createError && !duplicateUserError(createError.message)) {
    console.error("[guest-user] createUser", { email, message: createError.message });
    return { ok: false, reason: "error" };
  }

  const existing = await findAuthUserByEmail(admin, email);
  if (existing?.id) return { ok: true, userId: existing.id };
  return { ok: false, reason: "error" };
}
