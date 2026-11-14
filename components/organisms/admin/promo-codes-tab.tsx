"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_CRM_EYEBROW,
  ADMIN_CRM_FIELD,
  ADMIN_CRM_GLASS_PANEL,
} from "@/components/organisms/admin/admin-crm-field-styles";

const STORAGE_KEY = "dingry-crm-promo-codes-v2";

export type PromoCodeDraft = {
  id: string;
  code: string;
  discountPercent: number;
  createdAt: string;
  note: string;
  /** Nombre max d’utilisations (checkout). */
  maxUses: number;
  usedCount: number;
  /** Date de fin incluse (YYYY-MM-DD). */
  expiresAt: string;
};

function randomPromoCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return `DINGRY-${suffix}`;
}

function defaultExpiresAt(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}

function normalizeEntry(raw: unknown): PromoCodeDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Partial<PromoCodeDraft>;
  if (typeof entry.id !== "string" || typeof entry.code !== "string") return null;
  const discountPercent =
    typeof entry.discountPercent === "number" ? entry.discountPercent : 10;
  const createdAt =
    typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString();
  const note = typeof entry.note === "string" ? entry.note : "";
  const maxUses =
    typeof entry.maxUses === "number" && entry.maxUses > 0
      ? Math.min(99999, Math.floor(entry.maxUses))
      : 1;
  const usedCount =
    typeof entry.usedCount === "number" && entry.usedCount >= 0
      ? Math.floor(entry.usedCount)
      : 0;
  const expiresAt =
    typeof entry.expiresAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.expiresAt)
      ? entry.expiresAt
      : defaultExpiresAt();
  return {
    id: entry.id,
    code: entry.code,
    discountPercent,
    createdAt,
    note,
    maxUses,
    usedCount,
    expiresAt,
  };
}

function loadCodes(): PromoCodeDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY);
    const rawLegacy = window.localStorage.getItem("dingry-crm-promo-codes-v1");
    const raw = rawV2 ?? rawLegacy;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const list = parsed
      .map((entry) => normalizeEntry(entry))
      .filter((entry): entry is PromoCodeDraft => entry !== null);
    if (!rawV2 && list.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [];
  }
}

function persistCodes(codes: PromoCodeDraft[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}

function formatExpiresLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(y, m - 1, d));
}

function isExpired(entry: PromoCodeDraft, now = new Date()): boolean {
  const [y, m, d] = entry.expiresAt.split("-").map(Number);
  if (!y || !m || !d) return false;
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return now.getTime() > end.getTime();
}

function isDepleted(entry: PromoCodeDraft): boolean {
  return entry.usedCount >= entry.maxUses;
}

export function PromoCodesTab() {
  const [codes, setCodes] = useState<PromoCodeDraft[]>([]);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [maxUses, setMaxUses] = useState(50);
  const [expiresAt, setExpiresAt] = useState(defaultExpiresAt);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setCodes(loadCodes());
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  function generateCode() {
    const safeMax = Math.min(99999, Math.max(1, Math.floor(maxUses) || 1));
    const safeExpires = /^\d{4}-\d{2}-\d{2}$/.test(expiresAt) ? expiresAt : defaultExpiresAt();
    const next: PromoCodeDraft = {
      id: crypto.randomUUID(),
      code: randomPromoCode(),
      discountPercent: Math.min(50, Math.max(5, discountPercent)),
      createdAt: new Date().toISOString(),
      note: note.trim(),
      maxUses: safeMax,
      usedCount: 0,
      expiresAt: safeExpires,
    };
    const list = [next, ...codes];
    setCodes(list);
    persistCodes(list);
    setNote("");
    void navigator.clipboard?.writeText(next.code).then(
      () => showToast(`Code ${next.code} copié`),
      () => showToast(`Code créé · ${next.code}`),
    );
  }

  function removeCode(id: string) {
    const list = codes.filter((entry) => entry.id !== id);
    setCodes(list);
    persistCodes(list);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Copié · ${code}`);
    } catch {
      showToast(code);
    }
  }

  return (
    <div className="dingry-admin-stock max-w-2xl">
      {toast ? (
        <p className="mb-3 text-sm text-emerald-300" role="status">
          {toast}
        </p>
      ) : null}
      <p className="mb-4 text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
        Génère des codes à usage CRM (copie rapide). Branchement checkout à prévoir côté boutique.
      </p>
      <section className={ADMIN_CRM_GLASS_PANEL}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className={ADMIN_CRM_EYEBROW}>Remise %</span>
            <input
              type="number"
              min={5}
              max={50}
              value={discountPercent}
              onChange={(event) => setDiscountPercent(Number(event.target.value) || 10)}
              className={`${ADMIN_CRM_FIELD} w-24`}
            />
          </label>
          <label className="block">
            <span className={ADMIN_CRM_EYEBROW}>Quantité max</span>
            <input
              type="number"
              min={1}
              max={99999}
              value={maxUses}
              onChange={(event) => setMaxUses(Number(event.target.value) || 1)}
              className={`${ADMIN_CRM_FIELD} w-28`}
            />
          </label>
          <label className="block">
            <span className={ADMIN_CRM_EYEBROW}>Péremption</span>
            <input
              type="date"
              value={expiresAt}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setExpiresAt(event.target.value)}
              className={`${ADMIN_CRM_FIELD} [color-scheme:dark]`}
            />
          </label>
          <label className="block min-w-[10rem] flex-1">
            <span className={ADMIN_CRM_EYEBROW}>Note interne</span>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Campagne, influenceur…"
              className={ADMIN_CRM_FIELD}
            />
          </label>
          <button
            type="button"
            onClick={generateCode}
            className="h-10 shrink-0 border border-violet-400/35 bg-violet-500/10 px-4 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-100 transition hover:border-violet-300/50"
          >
            Générer un code
          </button>
        </div>
      </section>
      <ul className={`mt-4 divide-y divide-white/[0.06] ${ADMIN_CRM_GLASS_PANEL} !p-0`}>
        {codes.length === 0 ? (
          <li className="px-4 py-8 text-sm text-white/40">Aucun code pour l’instant.</li>
        ) : (
          codes.map((entry) => {
            const expired = isExpired(entry);
            const depleted = isDepleted(entry);
            const inactive = expired || depleted;
            return (
              <li
                key={entry.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${inactive ? "opacity-60" : ""}`}
              >
                <div>
                  <p className="font-mono text-sm text-white">{entry.code}</p>
                  <p className="mt-1 text-[11px] text-white/45">
                    −{entry.discountPercent} % · {entry.usedCount}/{entry.maxUses} utilisations · expire le{" "}
                    {formatExpiresLabel(entry.expiresAt)}
                    {expired ? (
                      <span className="text-red-300/90"> · expiré</span>
                    ) : depleted ? (
                      <span className="text-amber-200/90"> · quota atteint</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    Créé le {new Date(entry.createdAt).toLocaleString("fr-FR")}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void copyCode(entry.code)}
                    className="h-8 border border-white/15 px-3 text-[9px] uppercase tracking-[0.14em] text-white/75"
                  >
                    Copier
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCode(entry.id)}
                    className="h-8 border border-red-500/30 px-3 text-[9px] uppercase tracking-[0.14em] text-red-200/80"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}