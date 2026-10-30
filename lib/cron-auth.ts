import { timingSafeEqual } from "node:crypto";

export const MIN_CRON_SECRET_LENGTH = 32;

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

function cronMisconfigured(): CronAuthResult {
  return { ok: false, status: 503, error: "CRON non configuré." };
}

/** Secret requis en prod ; dev sans secret uniquement si NODE_ENV=development. */
export function assertCronAuthorized(request: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return { ok: true };
    }
    return cronMisconfigured();
  }

  if (secret.length < MIN_CRON_SECRET_LENGTH) {
    return cronMisconfigured();
  }

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const left = Buffer.from(header);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, status: 401, error: "Non autorisé." };
  }

  return { ok: true };
}
