export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Déploiement Vercel Preview (`VERCEL_ENV=preview`, hors prod custom). */
export function isVercelPreviewRuntime(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

/** Seed / fichier local autorisés si lecture Blob impossible (dev + preview). */
export function allowCatalogSeedFallback(): boolean {
  return process.env.NODE_ENV !== "production" || isVercelPreviewRuntime();
}
