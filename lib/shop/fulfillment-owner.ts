const DEFAULT_OWNER = "dingryofficiel@gmail.com";

export function fulfillmentOwnerEmail(): string {
  const fromEnv = (process.env.DINGRY_FULFILLMENT_OWNER_EMAIL ?? "").trim().toLowerCase();
  return fromEnv || DEFAULT_OWNER;
}

export function isFulfillmentOwnerEmail(email: string | null | undefined): boolean {
  const value = email?.trim().toLowerCase() ?? "";
  if (!value) return false;
  return value === fulfillmentOwnerEmail();
}
