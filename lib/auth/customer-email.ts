/** E-mail client exploitable (PayPal, CRM, rattachement compte). */
export function customerEmailUsable(email: string | undefined): email is string {
  const trimmed = email?.trim() ?? "";
  return trimmed.length > 0 && trimmed !== "—" && trimmed.includes("@");
}

export function normalizeCustomerEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!customerEmailUsable(trimmed)) return null;
  return trimmed.slice(0, 180);
}
