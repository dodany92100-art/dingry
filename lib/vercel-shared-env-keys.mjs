/**
 * Variables à déclarer sur Vercel avec les mêmes cibles Preview + Production
 * (sinon dingry.com et les déploiements preview divergent).
 */

/** @type {ReadonlyArray<{ key: string; plain?: boolean }>} */
export const VERCEL_SHARED_ENV_KEYS = [
  { key: "DINGRY_IMG_HOSTS", plain: true },
  { key: "NEXT_PUBLIC_MEDIA_CDN_HOST", plain: true },
  { key: "NEXT_PUBLIC_SUPABASE_URL", plain: true },
  { key: "NEXT_PUBLIC_SUPABASE_OAUTH_GOOGLE", plain: true },
  { key: "SUPABASE_URL" },
  { key: "SUPABASE_SERVICE_ROLE_KEY" },
  { key: "SUPABASE_IMAGES_BUCKET", plain: true },
  { key: "R2_PUBLIC_BASE_URL", plain: true },
  { key: "R2_ACCOUNT_ID" },
  { key: "R2_BUCKET_NAME", plain: true },
  { key: "R2_ACCESS_KEY_ID" },
  { key: "R2_SECRET_ACCESS_KEY" },
  { key: "R2_S3_ENDPOINT", plain: true },
  { key: "ADMIN_TOTP_SECRET" },
  { key: "ADMIN_SESSION_SECRET" },
  { key: "NEXT_PUBLIC_PAYPAL_CLIENT_ID", plain: true },
  { key: "PAYPAL_CLIENT_ID" },
  { key: "PAYPAL_CLIENT_SECRET" },
  { key: "PAYPAL_WEBHOOK_ID" },
  { key: "PAYPAL_ENV", plain: true },
  { key: "NEXT_PUBLIC_TURNSTILE_SITE_KEY", plain: true },
  { key: "TURNSTILE_SECRET_KEY" },
  { key: "TURNSTILE_EXPECTED_HOSTNAME", plain: true },
  { key: "UPSTASH_REDIS_REST_URL" },
  { key: "UPSTASH_REDIS_REST_TOKEN" },
  { key: "CRON_SECRET" },
  { key: "RESEND_API_KEY" },
  { key: "OPS_ALERT_EMAIL", plain: true },
  { key: "OPS_ALERT_FROM", plain: true },
  { key: "NEXT_PUBLIC_SITE_URL", plain: true },
];

export const VERCEL_ENV_TARGETS = ["preview", "production"];
