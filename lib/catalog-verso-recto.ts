import { DINGRY_SWEAT_CATALOG } from "@/lib/dingry-product-media";

/** Hoodies historiques : fiche vitrine verso → id recto seedé dans le CRM. */
export const LEGACY_HOODIE_VERSO_TO_RECTO: Readonly<Record<number, number>> = {
  1: 2,
  3: 7,
  5: 4,
  8: 6,
};

/** Hoodies Paris / chocolat : verso → recto (aligné seed admin). */
const HOODIE_VERSO_TO_RECTO: Readonly<Record<number, number>> = {
  26: 25,
  28: 27,
  30: 29,
  36: 35,
};

/** Ids recto tee présents dans le CRM (ordre catalogue). */
const TEE_CRM_RECTO_IDS = [11, 13, 17, 19, 21] as const;

function teeRectoForOrphanVerso(versoId: number): number | undefined {
  if (versoId < 11 || versoId > 21) return undefined;
  let anchor: number | undefined;
  for (const rectoId of TEE_CRM_RECTO_IDS) {
    if (rectoId < versoId) anchor = rectoId;
    else break;
  }
  return anchor;
}

function buildVersoToRectoMap(): ReadonlyMap<number, number> {
  const map = new Map<number, number>();

  for (const [verso, recto] of Object.entries(LEGACY_HOODIE_VERSO_TO_RECTO)) {
    map.set(Number(verso), Number(recto));
  }
  for (const [verso, recto] of Object.entries(HOODIE_VERSO_TO_RECTO)) {
    map.set(Number(verso), Number(recto));
  }
  for (const entry of DINGRY_SWEAT_CATALOG) {
    map.set(entry.versoId, entry.rectoId);
  }
  for (const versoId of [12, 14, 15, 16, 18, 20] as const) {
    const rectoId = teeRectoForOrphanVerso(versoId);
    if (rectoId !== undefined) map.set(versoId, rectoId);
  }

  return map;
}

export const VERSO_TO_RECTO_CATALOG_ID = buildVersoToRectoMap();

/** Id CRM à utiliser pour prix / stock / SKU quand le verso n’a pas sa propre fiche. */
export function resolveRectoCatalogId(catalogProductId: number): number {
  return VERSO_TO_RECTO_CATALOG_ID.get(catalogProductId) ?? catalogProductId;
}

export function isVersoCatalogId(catalogProductId: number): boolean {
  return VERSO_TO_RECTO_CATALOG_ID.has(catalogProductId);
}

export function versoSkuFromRecto(rectoSku: string): string {
  const trimmed = rectoSku.trim();
  if (trimmed.endsWith("-V")) return trimmed;
  return `${trimmed}-V`;
}
