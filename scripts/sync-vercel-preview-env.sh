#!/usr/bin/env bash
# Sync Preview env on Vercel from .env.vercel.production (run after vercel env pull production).
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=".env.vercel.production"
if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC — run: vercel env pull .env.vercel.production --environment=production --yes"
  exit 1
fi

strip_quotes() {
  local v="$1"
  v="${v#\"}"
  v="${v%\"}"
  v="${v#\'}"
  v="${v%\'}"
  printf '%s' "$v"
}

get_var() {
  local name="$1"
  local line
  line=$(grep -E "^${name}=" "$SRC" | tail -1 || true)
  if [[ -z "$line" ]]; then
    return 1
  fi
  strip_quotes "${line#*=}"
}

add_preview() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "skip $name (empty)"
    return 0
  fi
  if vercel env ls preview 2>/dev/null | grep -q " ${name} "; then
    printf '%s' "$value" | vercel env update "$name" preview --yes 2>/dev/null || true
    echo "updated $name (preview)"
  else
    printf '%s' "$value" | vercel env add "$name" preview --yes
    echo "added $name (preview)"
  fi
}

KEYS=(
  ADMIN_TOTP_SECRET
  BLOB_READ_WRITE_TOKEN
  NEXT_PUBLIC_PAYPAL_CLIENT_ID
  NEXT_PUBLIC_TURNSTILE_SITE_KEY
  PAYPAL_CLIENT_SECRET
  TURNSTILE_SECRET_KEY
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
)

for key in "${KEYS[@]}"; do
  if val=$(get_var "$key"); then
    add_preview "$key" "$val"
  else
    echo "skip $key (not in $SRC)"
  fi
done

add_preview "PAYPAL_ENV" "sandbox"

if ! vercel env ls preview 2>/dev/null | grep -q " CRON_SECRET "; then
  cron=$(openssl rand -base64 32 | tr -d '\n')
  add_preview "CRON_SECRET" "$cron"
  if ! vercel env ls production 2>/dev/null | grep -q " CRON_SECRET "; then
    printf '%s' "$cron" | vercel env add CRON_SECRET production --yes
    echo "added CRON_SECRET (production)"
  fi
else
  echo "CRON_SECRET already on preview"
fi

echo "Preview env sync done."
