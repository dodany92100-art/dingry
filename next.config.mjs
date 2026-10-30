/** @type {import('next').NextConfig} */

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js (inline + eval en dev), Turnstile, PayPal, Vercel Analytics
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://*.paypal.com https://*.paypalobjects.com https://*.sandbox.paypal.com https://va.vercel-scripts.com",
  // Feuille Google Fonts importée dans app/globals.css
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Cloudinary, Unsplash et le reste des visuels HTTPS
  "img-src 'self' data: https:",
  // Turnstile, PayPal et Vercel Analytics. Upstash n’est appelé que par le serveur.
  "connect-src 'self' https://challenges.cloudflare.com https://*.paypal.com https://*.paypalobjects.com https://*.sandbox.paypal.com https://vitals.vercel-insights.com",
  // Iframe Turnstile + boutons / carte PayPal
  "frame-src https://challenges.cloudflare.com https://*.paypal.com https://*.paypalobjects.com https://*.sandbox.paypal.com",
  "worker-src 'self' blob:",
  "form-action 'self' https://*.paypal.com https://*.sandbox.paypal.com",
  // Équivalent CSP de X-Frame-Options: DENY
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
];

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
    ];
  },
};

export default nextConfig;
