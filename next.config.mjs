/** @type {import('next').NextConfig} */
import { execSync } from "node:child_process";
import { validateProductionEnv } from "./lib/env-core.mjs";

validateProductionEnv();

function crmVersionPatch() {
  if (process.env.CRM_VERSION_PATCH) return process.env.CRM_VERSION_PATCH;
  let count = "0";
  try {
    count = execSync("git rev-list --count HEAD", { encoding: "utf8" }).trim();
  } catch {
    count = String(Math.floor(Date.now() / 1000));
  }
  const deploy = (process.env.VERCEL_DEPLOYMENT_ID ?? "").trim();
  if (deploy) return `${count}.${deploy.slice(-6)}`;
  return count;
}

const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  [
    "script-src 'self'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "'unsafe-inline'",
    "https://challenges.cloudflare.com",
    "https://*.paypal.com",
    "https://*.paypalobjects.com",
    "https://*.sandbox.paypal.com",
    "https://va.vercel-scripts.com",
  ].join(" "),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https://res.cloudinary.com https://*.public.blob.vercel-storage.com https://*.supabase.co",
  "connect-src 'self' https://challenges.cloudflare.com https://*.paypal.com https://*.paypalobjects.com https://*.sandbox.paypal.com https://vitals.vercel-insights.com",
  "frame-src https://challenges.cloudflare.com https://*.paypal.com https://*.paypalobjects.com https://*.sandbox.paypal.com",
  "worker-src 'self' blob:",
  "form-action 'self' https://*.paypal.com https://*.sandbox.paypal.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
];

const noStore = [{ key: "Cache-Control", value: "no-store" }];
const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_CRM_BUILD_AT:
      process.env.VERCEL_DEPLOYMENT_CREATED_AT ??
      process.env.CRM_BUILD_AT ??
      new Date().toISOString(),
    NEXT_PUBLIC_CRM_VERSION_PATCH: crmVersionPatch(),
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/catalog",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [...noStore, ...noIndex],
      },
      {
        source: "/admin/:path*",
        headers: noIndex,
      },
      {
        source: "/legal/:path*",
        headers: noIndex,
      },
    ];
  },
};

export default nextConfig;
