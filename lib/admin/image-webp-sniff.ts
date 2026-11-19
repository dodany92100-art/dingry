/** En-tête RIFF….WEBP (12 octets minimum). */
export function isWebpBuffer(bytes: Uint8Array | Buffer): boolean {
  if (bytes.byteLength < 12) return false;
  const riff = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
  const webp = String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!);
  return riff === "RIFF" && webp === "WEBP";
}

export function webpHeaderError(): string {
  return "Fichier WebP invalide (signature manquante).";
}