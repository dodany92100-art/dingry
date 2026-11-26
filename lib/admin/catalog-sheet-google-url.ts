import { isXlsxZipBuffer } from "@/lib/catalog/catalog-sheet-workbook";

export type ParsedGoogleSpreadsheetUrl = {
  spreadsheetId: string;
  gid: string | null;
};

/** Extrait l’ID (et l’onglet gid) depuis un lien Google Sheets / partage. */
export function parseGoogleSpreadsheetUrl(raw: string): ParsedGoogleSpreadsheetUrl | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "docs.google.com" && host !== "drive.google.com") return null;

    let spreadsheetId: string | null = null;
    const dMatch = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (dMatch) spreadsheetId = dMatch[1]!;
    if (!spreadsheetId) {
      const openMatch = url.pathname.match(/\/open/);
      const idParam = url.searchParams.get("id");
      if (openMatch && idParam) spreadsheetId = idParam;
    }
    if (!spreadsheetId) return null;

    const gid =
      url.searchParams.get("gid") ??
      url.hash.match(/gid=(\d+)/)?.[1] ??
      null;

    return { spreadsheetId, gid };
  } catch {
    return null;
  }
}

export function googleSheetXlsxExportUrl(spreadsheetId: string, gid: string | null): string {
  const base = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/export?format=xlsx`;
  return gid ? `${base}&gid=${encodeURIComponent(gid)}` : base;
}

/** Télécharge l’export XLSX (feuille partagée « lecteur avec le lien »). */
export async function fetchGoogleSheetWorkbookBuffer(
  spreadsheetId: string,
  gid: string | null,
): Promise<ArrayBuffer> {
  const url = googleSheetXlsxExportUrl(spreadsheetId, gid);
  const response = await fetch(url, {
    redirect: "follow",
    headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*" },
  });
  if (!response.ok) {
    throw new Error(
      `Google Sheets inaccessible (${response.status}) — partage la feuille en « lecteur avec le lien ».`,
    );
  }
  const buffer = await response.arrayBuffer();
  if (!isXlsxZipBuffer(buffer)) {
    throw new Error(
      "Réponse Google invalide (connexion requise ?) — ouvre le lien en navigation privée : si tu dois te connecter, passe la feuille en lecture publique ou télécharge le .xlsx.",
    );
  }
  return buffer;
}