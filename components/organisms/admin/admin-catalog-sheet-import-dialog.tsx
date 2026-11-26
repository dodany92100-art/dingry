"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import type { CatalogSheetApplyReport } from "@/lib/admin/apply-catalog-sheet-import";
import {
  CATALOG_SHEET_FILE_ACCEPT,
  type CatalogSheetFilePayload,
  isCatalogSheetImportFile,
  type CatalogSheetClientPrepared,
  postAdminCatalogSheetImport,
  prepareCatalogSheetOnClient,
  readCatalogSheetFile,
} from "@/lib/admin/catalog-sheet-import-client";
import type { CatalogSheetCrmCandidate } from "@/lib/catalog/catalog-sheet";
import { parseGoogleSpreadsheetUrl } from "@/lib/admin/catalog-sheet-google-url";
import {
  catalogSheetFieldLabel,
  catalogSheetSummaryHeadline,
  formatCatalogSheetIssueLine,
  type CatalogSheetParseSummary,
  type CatalogSheetRowIssue,
} from "@/lib/catalog/catalog-sheet";

type AdminCatalogSheetImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
  onUnauthorized?: () => void;
};

function summarizeReport(report: CatalogSheetApplyReport): string {
  const parts = [
    `${report.created.length} création(s)`,
    `${report.updated.length} mise(s) à jour`,
    `${report.unchanged.length} inchangée(s) (ignorées)`,
  ];
  if (report.errors.length > 0) parts.push(`${report.errors.length} erreur(s)`);
  return parts.join(" · ");
}

function IssueBlock({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "error" | "warning";
  items: CatalogSheetRowIssue[];
}) {
  const [copied, setCopied] = useState(false);

  if (items.length === 0) return null;

  async function copyIssues() {
    const text = items.map((issue) => formatCatalogSheetIssueLine(issue)).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-2" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={`text-[10px] font-medium uppercase tracking-[0.16em] ${
            tone === "error" ? "text-red-400/90" : "text-amber-300/80"
          }`}
        >
          {title} ({items.length})
        </p>
        <button
          type="button"
          onClick={() => void copyIssues()}
          className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-white/60 transition hover:border-white/30 hover:text-white"
        >
          {copied ? "Copié" : tone === "error" ? "Copier les erreurs" : "Copier les avertissements"}
        </button>
      </div>
      <ul className="max-h-[min(44vh,24rem)] space-y-2.5 overflow-y-auto rounded-lg border border-white/8 bg-black/30 p-3.5 text-xs leading-relaxed text-white/75 sm:p-4">
        {items.map((issue, index) => (
          <li key={`${issue.code}-${issue.rowNumber ?? index}-${issue.sku ?? ""}`} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
            <p>
              {issue.rowNumber ? (
                <span className="font-medium text-white/90">Ligne {issue.rowNumber}</span>
              ) : (
                <span className="font-medium text-white/90">Fichier</span>
              )}
              {issue.sku ? <span className="text-white/45"> · {issue.sku}</span> : null}
              {issue.modelName ? <span className="text-white/45"> · {issue.modelName}</span> : null}
            </p>
            <p className="mt-0.5 text-white/65">
              {issue.field ? (
                <span className="text-white/40">Champ « {catalogSheetFieldLabel(issue.field)} » — </span>
              ) : null}
              {issue.message}
            </p>
            {issue.fixHint ? <p className="mt-1 text-emerald-400/75">→ {issue.fixHint}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminCatalogSheetImportDialog({
  open,
  onClose,
  onApplied,
  onUnauthorized,
}: AdminCatalogSheetImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileLabel, setFileLabel] = useState("");
  const [payload, setPayload] = useState<CatalogSheetFilePayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [parseSummary, setParseSummary] = useState<CatalogSheetParseSummary | null>(null);
  const [lastReport, setLastReport] = useState<CatalogSheetApplyReport | null>(null);
  const [mergeOverwrite, setMergeOverwrite] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [fileDragOver, setFileDragOver] = useState(false);
  const [clientPrepared, setClientPrepared] = useState<CatalogSheetClientPrepared | null>(null);
  const [wireCandidates, setWireCandidates] = useState<CatalogSheetCrmCandidate[] | null>(null);
  const [wireRowCount, setWireRowCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open) {
      setFileLabel("");
      setPayload(null);
      setMessage("");
      setError("");
      setParseSummary(null);
      setLastReport(null);
      setMergeOverwrite(false);
      setGoogleSheetUrl("");
      setSourceLabel("");
      setFileDragOver(false);
      setClientPrepared(null);
      setWireCandidates(null);
      setWireRowCount(0);
    }
  }, [open]);

  const hasSource = Boolean(payload) || Boolean(parseGoogleSpreadsheetUrl(googleSheetUrl));

  if (!open) return null;

  async function runImport(apply: boolean) {
    const sheetUrl = googleSheetUrl.trim();
    const parsedUrl = sheetUrl ? parseGoogleSpreadsheetUrl(sheetUrl) : null;
    if (!payload && !parsedUrl) {
      setError(
        "Choisis un fichier (.csv, .json, .xlsx) ou colle un lien Google Sheets partagé en lecture.",
      );
      return;
    }
    if (sheetUrl && !parsedUrl) {
      setError("Lien Google Sheets invalide — URL complète docs.google.com/spreadsheets/d/…");
      return;
    }
    if (!parsedUrl && clientPrepared && !clientPrepared.ok) {
      setParseSummary(clientPrepared.summary);
      setError(clientPrepared.error);
      setMessage(catalogSheetSummaryHeadline(clientPrepared.summary));
      return;
    }

    setBusy(true);
    setError("");
    setMessage(apply ? "Enregistrement des brouillons…" : "Analyse du fichier…");
    const mergeText = mergeOverwrite ? ("overwrite" as const) : ("fill-empty" as const);
    const body = parsedUrl
      ? { googleSheetUrl: sheetUrl, apply, mergeText }
      : wireCandidates && clientPrepared?.ok
        ? { candidates: wireCandidates, rowCount: wireRowCount, apply, mergeText }
        : payload!.kind === "csv"
          ? { csvText: payload!.csvText, apply, mergeText }
          : { rows: payload!.rows, apply, mergeText };
    const result = await postAdminCatalogSheetImport(body);
    setBusy(false);
    if (!result.ok) {
      if (result.status === 401) onUnauthorized?.();
      setParseSummary(result.summary ?? null);
      setError(result.error);
      setMessage(result.summary ? catalogSheetSummaryHeadline(result.summary) : "");
      return;
    }
    setParseSummary(result.summary);
    setLastReport(result.report);
    setMessage(
      `${catalogSheetSummaryHeadline(result.summary)} · ${
        result.report.dryRun ? "Simulation" : "Import"
      } · ${summarizeReport(result.report)}`,
    );
    if (apply && !result.report.dryRun) onApplied();
  }

  function onFileDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    event.dataTransfer.dropEffect = "copy";
    setFileDragOver(true);
  }

  function onFileDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setFileDragOver(false);
  }

  function onFileDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setFileDragOver(false);
    if (busy) return;
    const file = event.dataTransfer.files[0] ?? null;
    if (!file) return;
    if (!isCatalogSheetImportFile(file)) {
      setError("Format non accepté — .csv, .json ou Excel (.xlsx…).");
      return;
    }
    void onPickFile(file);
  }

  async function onPickFile(file: File | null) {
    if (!file) return;
    setError("");
    setMessage("");
    setParseSummary(null);
    setLastReport(null);
    try {
      const next = await readCatalogSheetFile(file);
      const prepared = prepareCatalogSheetOnClient(next);
      setClientPrepared(prepared);
      setPayload(next);
      setFileLabel(file.name);
      setSourceLabel(file.name);
      setGoogleSheetUrl("");
      if (prepared.ok) {
        setWireCandidates(prepared.candidates);
        setWireRowCount(prepared.rowCount);
        setParseSummary(prepared.summary);
        setLastReport(null);
        setError("");
        setMessage(
          "Fichier validé localement — « Simuler » envoie uniquement les fiches CRM (léger).",
        );
      } else {
        setWireCandidates(null);
        setWireRowCount(0);
        setParseSummary(prepared.summary);
        setLastReport(null);
        setError(prepared.error);
        setMessage(catalogSheetSummaryHeadline(prepared.summary));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lecture du fichier impossible.");
      setPayload(null);
      setFileLabel("");
      setSourceLabel("");
      setClientPrepared(null);
      setWireCandidates(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6 md:p-8">
      <button
        type="button"
        aria-label="Fermer l’import catalogue"
        className="absolute inset-0 bg-[#02040a]/88"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-catalog-import-title"
        className="relative z-[1] flex max-h-[min(94vh,52rem)] w-full max-w-[min(100%,36rem)] flex-col border border-white/10 bg-[#0c0c0c] shadow-[0_24px_80px_rgb(0_0_0/0.55)] sm:max-w-3xl sm:rounded-2xl lg:max-w-4xl"
      >
        <div className="border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
          <p id="admin-catalog-import-title" className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#ff8a4d]">
            Importer catalogue
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            Fichier <span className="text-white/85">.csv</span>, <span className="text-white/85">.json</span>,{" "}
            <span className="text-white/85">Excel (.xlsx)</span> ou lien{" "}
            <span className="text-white/85">Google Sheets</span> (partage lecteur). Brouillons créés ou mis à jour — puis
            photos et publication.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:space-y-5 sm:px-7 sm:py-5">
          <input
            ref={inputRef}
            type="file"
            accept={CATALOG_SHEET_FILE_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void onPickFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            aria-label="Choisir ou déposer un fichier catalogue"
            onClick={() => inputRef.current?.click()}
            onDragEnter={onFileDragOver}
            onDragOver={onFileDragOver}
            onDragLeave={onFileDragLeave}
            onDrop={onFileDrop}
            className={`w-full rounded-xl border border-dashed px-4 py-8 text-center text-[11px] uppercase tracking-[0.14em] transition disabled:opacity-40 ${
              fileDragOver
                ? "border-[#FF3D00]/70 bg-[#FF3D00]/[0.08] text-white"
                : "border-white/20 bg-white/[0.03] text-white/60 hover:border-[#FF3D00]/40 hover:text-white"
            }`}
          >
            {fileDragOver
              ? "Déposer le fichier ici"
              : fileLabel
                ? `Fichier : ${fileLabel}`
                : "Glisser-déposer ou cliquer — .csv · .json · Excel (.xlsx)"}
          </button>

          <div className="space-y-1.5">
            <label htmlFor="admin-catalog-google-url" className="text-[10px] uppercase tracking-[0.14em] text-white/45">
              Ou lien Google Sheets
            </label>
            <input
              id="admin-catalog-google-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              disabled={busy}
              value={googleSheetUrl}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              onChange={(event) => {
                setGoogleSheetUrl(event.target.value);
                setPayload(null);
                setFileLabel("");
                const value = event.target.value.trim();
                setSourceLabel(value && parseGoogleSpreadsheetUrl(value) ? "Google Sheets (lien)" : "");
                setParseSummary(null);
                setLastReport(null);
                setClientPrepared(null);
                setWireCandidates(null);
                setError("");
                setMessage(
                  value && parseGoogleSpreadsheetUrl(value)
                    ? "Lien prêt — lance « Simuler » (lecture depuis Google, feuille en accès lecteur)."
                    : "",
                );
              }}
              className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2.5 text-sm text-white/85 placeholder:text-white/30 focus:border-[#FF3D00]/50 focus:outline-none disabled:opacity-40"
            />
          </div>

          {sourceLabel ? (
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Source : {sourceLabel}</p>
          ) : null}

          <label className="flex cursor-pointer items-start gap-2 text-[11px] text-white/55">
            <input
              type="checkbox"
              checked={mergeOverwrite}
              disabled={busy}
              onChange={(event) => setMergeOverwrite(event.target.checked)}
              className="mt-0.5"
            />
            <span>Écraser les textes existants (sinon : compléter les champs vides seulement)</span>
          </label>

          {parseSummary ? (
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
              {catalogSheetSummaryHeadline(parseSummary)}
            </p>
          ) : null}

          {message && !error ? <p className="text-sm text-emerald-400/90">{message}</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          {parseSummary ? (
            <div className="space-y-3">
              <IssueBlock title="Erreurs — à corriger dans le fichier" tone="error" items={parseSummary.errors} />
              <IssueBlock title="Avertissements — informatifs" tone="warning" items={parseSummary.warnings} />
            </div>
          ) : null}

          {lastReport?.genderPendingSchema ? (
            <p className="text-[11px] text-white/45">
              Genre : lu dans le fichier mais non enregistré en base (colonne sans champ CRM dédié pour l’instant).
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-4 sm:px-7 sm:py-5">
          <button
            type="button"
            disabled={busy || !hasSource}
            onClick={() => void runImport(false)}
            className="h-10 flex-1 rounded-full border border-white/15 text-[10px] uppercase tracking-[0.12em] text-white/75 hover:text-white disabled:opacity-35"
          >
            Simuler
          </button>
          <button
            type="button"
            disabled={busy || !hasSource || (parseSummary?.errorCount ?? 0) > 0}
            onClick={() => void runImport(true)}
            className="dingry-gold-pill-btn h-10 flex-1 rounded-full px-4 text-[10px] uppercase tracking-[0.12em] disabled:opacity-35"
            title={
              (parseSummary?.errorCount ?? 0) > 0
                ? "Corrige les erreurs du fichier avant d’enregistrer."
                : undefined
            }
          >
            <span className="gold-text">Enregistrer brouillons</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-10 w-full rounded-full border border-white/10 text-[10px] uppercase tracking-[0.12em] text-white/50 sm:w-auto sm:px-5"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}