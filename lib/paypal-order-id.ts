/** IDs de commande / capture PayPal (REST) — alphanum, tirets, underscores. */
export function isPayPalOrderId(value: string): boolean {
  const id = value.trim();
  return id.length >= 8 && id.length <= 80 && /^[A-Za-z0-9_-]+$/.test(id);
}
