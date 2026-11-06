/** @type {import('next').NextConfig} */

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
  "img-src 'self' data: https://res.cloudinary.com https://*.public.blob.vercel-storage.com",
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
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
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
