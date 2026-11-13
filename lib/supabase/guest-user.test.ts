import { describe, expect, it, vi } from "vitest";
import { ensureSupabaseUserForGuestCheckout } from "@/lib/supabase/guest-user";

const createUser = vi.fn();
const listUsers = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseStoreEnabled: vi.fn(() => true),
  supabaseAdmin: vi.fn(() => ({
    auth: {
      admin: {
        createUser,
        listUsers,
      },
    },
  })),
}));

describe("ensureSupabaseUserForGuestCheckout", () => {
  it("crée un utilisateur confirmé", async () => {
    createUser.mockResolvedValueOnce({
      data: { user: { id: "new-user" } },
      error: null,
    });
    const result = await ensureSupabaseUserForGuestCheckout("Guest@Example.com", "Guest Buyer");
    expect(result).toEqual({ ok: true, userId: "new-user" });
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "guest@example.com",
        email_confirm: true,
      }),
    );
  });

  it("réutilise un compte existant si createUser échoue", async () => {
    createUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User already registered" },
    });
    listUsers.mockResolvedValueOnce({
      data: { users: [{ id: "existing", email: "guest@example.com" }] },
      error: null,
    });
    const result = await ensureSupabaseUserForGuestCheckout("guest@example.com");
    expect(result).toEqual({ ok: true, userId: "existing" });
  });
});
