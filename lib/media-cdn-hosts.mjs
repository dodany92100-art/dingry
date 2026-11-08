/**
 * Hôtes images autorisés (CSP + remotePatterns). Env : DINGRY_IMG_HOSTS (virgules), ex. cdn.dingry.com
 * R2 public : *.r2.dev ou domaine custom — pas r2.cloudflarestorage.com (API S3, pas navigateur).
 */

const DEFAULT_IMG_SRC = [
  "https://res.cloudinary.com",
  "https://*.public.blob.vercel-storage.com",
  "https://*.supabase.co",
  "https://*.r2.dev",
  "https://images.unsplash.com",
];

function parseExtraHosts() {
  const raw = (process.env.DINGRY_IMG_HOSTS ?? process.env.NEXT_PUBLIC_MEDIA_CDN_HOST ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("http://") || part.startsWith("https://")) {
        try {
          return new URL(part).hostname;
        } catch {
          return part;
        }
      }
      return part.replace(/^\/+|\/+$/g, "");
    })
    .filter(Boolean);
}

export function buildImgSrcCspList() {
  const extra = parseExtraHosts().map((host) => `https://${host}`);
  return [...DEFAULT_IMG_SRC, ...extra];
}

export function buildImageRemotePatterns() {
  const patterns = [
    { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
    { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    { protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
  ];
  for (const host of parseExtraHosts()) {
    patterns.push({ protocol: "https", hostname: host, pathname: "/**" });
  }
  return patterns;
}
