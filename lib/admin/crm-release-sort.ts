type CrmReleaseSortEntry = {
  deployedAtLabel: string;
  versionHint?: string;
};

const FR_MONTH: Record<string, number> = {
  jan: 0,
  janv: 0,
  fev: 1,
  fév: 1,
  fevr: 1,
  mar: 2,
  avr: 3,
  mai: 4,
  jun: 5,
  jui: 6,
  juil: 6,
  aou: 7,
  aoû: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  déc: 11,
  dec: 11,
};

/** Parse « 19 nov. 2026 » → timestamp UTC (jour unique). */
export function parseCrmReleaseDeployedAtMs(label: string): number {
  const norm = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const match = norm.match(/(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})/);
  if (!match) return 0;
  const dayRaw = match[1];
  const monthRaw = match[2];
  const yearRaw = match[3];
  if (dayRaw === undefined || monthRaw === undefined || yearRaw === undefined) return 0;
  const day = Number(dayRaw);
  const monthToken = monthRaw.replace(/\./g, "").slice(0, 5);
  let month = FR_MONTH[monthToken];
  if (month == null) {
    const hit = Object.entries(FR_MONTH).find(([key]) => monthToken.startsWith(key) || key.startsWith(monthToken));
    month = hit?.[1];
  }
  if (month == null) return 0;
  return Date.UTC(Number(yearRaw), month, day);
}

function versionHintSortKey(hint: string | undefined): number {
  const t = hint?.trim() ?? "";
  if (!t) return -1;
  if (/^\d+$/.test(t)) return Number(t);
  const parts = t.split(".").map((p) => Number(p));
  if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
    return parts[0]! * 10_000 + parts[1]! * 100;
  }
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    return parts[0]! * 1_000_000 + parts[1]! * 10_000 + parts[2]!;
  }
  return 0;
}

/** Plus récent en premier (date, puis patch version). */
export function sortCrmReleaseHistoryNewestFirst<T extends CrmReleaseSortEntry>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => {
    const dateDiff = parseCrmReleaseDeployedAtMs(b.deployedAtLabel) - parseCrmReleaseDeployedAtMs(a.deployedAtLabel);
    if (dateDiff !== 0) return dateDiff;
    return versionHintSortKey(b.versionHint) - versionHintSortKey(a.versionHint);
  });
}