const DEFAULT_OWNER = "dingryofficiel@gmail.com";

export function isFulfillmentOwnerClient(email: string | null | undefined): boolean {
  const fromEnv = (process.env.NEXT_PUBLIC_DINGRY_FULFILLMENT_OWNER_EMAIL ?? "").trim().toLowerCase();
  const owner = fromEnv || DEFAULT_OWNER;
  const value = email?.trim().toLowerCase() ?? "";
  return value.length > 0 && value === owner;
}
