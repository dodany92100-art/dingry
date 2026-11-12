/** Téléphone livraison / contact (saisi avant PayPal, stocké dans le brouillon Redis). */
export const CUSTOMER_PHONE_MAX_LENGTH = 24;

export function normalizeCustomerPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > CUSTOMER_PHONE_MAX_LENGTH) return null;

  const compact = trimmed.replace(/[\s.\-()]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  if (/^0[1-9]\d{8}$/.test(compact)) return compact;
  return null;
}

export function customerPhoneFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const phone = (body as { customerPhone?: unknown }).customerPhone;
  return normalizeCustomerPhone(phone);
}

export function formatCustomerPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\s/g, "");
  if (/^0\d{9}$/.test(digits)) {
    return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return phone;
}
