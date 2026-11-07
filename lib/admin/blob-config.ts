export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Déploiement Vercel Preview (`VERCEL_ENV=preview`, hors prod custom). */
export function isVercelPreviewRuntime(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

/** Seed / fichier local si lecture Blob impossible — jamais si un token Blob est configuré (évite un faux catalogue en Preview). */
export function allowCatalogSeedFallback(): boolean {
  if (isBlobConfigured()) return false;
  return process.env.NODE_ENV !== "production" || isVercelPreviewRuntime();
}
