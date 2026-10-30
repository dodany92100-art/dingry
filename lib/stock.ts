/**
 * Stock Redis — une quantité par productId (pool global, toutes tailles).
 * Choix commercial : le champ admin `stock` est unique par fiche produit.
 */
import type { CheckoutLine } from "@/lib/checkout-quote";
import { getSharedRedis } from "@/lib/ratelimit";

export type StockLine = { productId: number; qty: number };

export class StockCheckoutError extends Error {
  readonly status: 409 | 503;

  constructor(status: 409 | 503, message: string) {
    super(message);
    this.name = "StockCheckoutError";
    this.status = status;
  }
}

const stockKeyPrefix = (): string => {
  const raw = process.env.STOCK_KEY_PREFIX?.trim();
  const base = raw && raw.length > 0 ? raw : "dingry:";
  return base.endsWith(":") ? base : `${base}:`;
};

const stockKey = (productId: number): string => `${stockKeyPrefix()}stock:${productId}`;
const appliedKey = (orderId: string): string => `${stockKeyPrefix()}stock-applied:${orderId}`;
const restoredKey = (orderId: string): string => `${stockKeyPrefix()}stock-restored:${orderId}`;

/** 2 = déjà appliqué, 1 = appliqué, 0 = rupture, -1 = clé absente ou valeur invalide */
const APPLY_LUA = `
if redis.call("exists", KEYS[1]) == 1 then return 2 end
for i = 2, #KEYS do
  local s = redis.call("get", KEYS[i])
  if not s then return -1 end
  local n = tonumber(s)
  if not n then return -1 end
  if n < tonumber(ARGV[i-1]) then return 0 end
end
for i = 2, #KEYS do redis.call("decrby", KEYS[i], ARGV[i-1]) end
redis.call("set", KEYS[1], "1")
return 1`;

const RESTORE_LUA = `
if redis.call("exists", KEYS[1]) == 0 then return 0 end
if redis.call("exists", KEYS[2]) == 1 then return 2 end
for i = 3, #KEYS do
  if redis.call("exists", KEYS[i]) == 0 then return -1 end
end
for i = 3, #KEYS do redis.call("incrby", KEYS[i], ARGV[i-2]) end
redis.call("set", KEYS[2], "1")
return 1`;

const ADJUST_LUA = `
local s = redis.call("get", KEYS[1])
if not s then return -1 end
local current = tonumber(s)
if not current then return -1 end
local delta = tonumber(ARGV[1])
if not delta then return -1 end
local n = current + delta
if n < 0 then return -2 end
redis.call("incrby", KEYS[1], ARGV[1])
return tonumber(redis.call("get", KEYS[1]))`;

export function isStockLineValid(line: StockLine): boolean {
  return (
    Number.isInteger(line.productId) &&
    line.productId > 0 &&
    Number.isInteger(line.qty) &&
    line.qty > 0
  );
}

/** Toutes les lignes doivent être valides ; aucune ligne filtrée silencieusement. */
export function prepareStockAggregate(
  lines: StockLine[],
): { ok: true; agg: [string, number][] } | { ok: false } {
  if (lines.length === 0) return { ok: false };
  for (const line of lines) {
    if (!isStockLineValid(line)) return { ok: false };
  }
  const agg = aggregateStockLines(lines);
  if (agg.length === 0) return { ok: false };
  return { ok: true, agg };
}

export function aggregateStockLines(lines: StockLine[]): [string, number][] {
  const totals = new Map<number, number>();
  for (const line of lines) {
    if (!isStockLineValid(line)) continue;
    totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.qty);
  }
  return [...totals.entries()].map(([productId, qty]) => [stockKey(productId), qty]);
}

export function stockLinesFromCheckout(lines: CheckoutLine[]): StockLine[] {
  return lines.map((line) => ({ productId: line.productId, qty: line.qty }));
}

export async function seedStockIfMissing(productId: number, qty: number): Promise<void> {
  const client = getSharedRedis();
  if (!client) return;
  const safe = Math.max(0, Math.floor(qty));
  await client.set(stockKey(productId), String(safe), { nx: true });
}

export async function seedCatalogStockFromProducts(
  products: { id: string; stock: number }[],
): Promise<void> {
  const tasks: Promise<void>[] = [];
  for (const product of products) {
    const id = Number(product.id);
    if (!Number.isInteger(id) || id <= 0) continue;
    tasks.push(seedStockIfMissing(id, product.stock));
  }
  await Promise.all(tasks);
}

function parseStockQuantity(value: string | null | undefined): number | "missing" {
  if (value === null || value === undefined) return "missing";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "missing";
  return Math.max(0, Math.floor(parsed));
}

export async function readStockQuantity(
  productId: number,
): Promise<number | "missing" | "unavailable"> {
  const client = getSharedRedis();
  if (!client) return "unavailable";
  try {
    const value = await client.get<string>(stockKey(productId));
    const parsed = parseStockQuantity(value);
    return parsed === "missing" ? "missing" : parsed;
  } catch (error) {
    console.error("[stock] Redis", error instanceof Error ? error.name : "erreur");
    return "unavailable";
  }
}

export async function assertCheckoutStock(
  lines: StockLine[],
): Promise<{ ok: true } | { ok: false; status: 409 | 503; error: string }> {
  const client = getSharedRedis();
  if (!client) {
    return { ok: false, status: 503, error: "Stock indisponible." };
  }

  const prepared = prepareStockAggregate(lines);
  if (!prepared.ok) {
    return { ok: false, status: 409, error: "Un article n'est plus disponible en quantité suffisante." };
  }

  try {
    const values = await client.mget<(string | null)[]>(...prepared.agg.map(([key]) => key));
    for (let i = 0; i < prepared.agg.length; i++) {
      const value = values[i];
      const quantity = parseStockQuantity(value);
      if (quantity === "missing") {
        console.error("[stock] clé non initialisée", prepared.agg[i][0]);
        return { ok: false, status: 503, error: "Stock indisponible." };
      }
      if (quantity < prepared.agg[i][1]) {
        return {
          ok: false,
          status: 409,
          error: "Un article n'est plus disponible en quantité suffisante.",
        };
      }
    }
    return { ok: true };
  } catch (error) {
    console.error("[stock] Redis", error instanceof Error ? error.name : "erreur");
    return { ok: false, status: 503, error: "Stock indisponible." };
  }
}

export async function applyCheckoutStock(
  orderId: string,
  lines: StockLine[],
): Promise<"applied" | "short" | "unavailable"> {
  const client = getSharedRedis();
  if (!client) return "unavailable";

  const prepared = prepareStockAggregate(lines);
  if (!prepared.ok) return "short";

  try {
    const result = (await client.eval(
      APPLY_LUA,
      [appliedKey(orderId), ...prepared.agg.map(([key]) => key)],
      prepared.agg.map(([, qty]) => String(qty)),
    )) as number;

    if (result === 1 || result === 2) return "applied";
    if (result === 0) return "short";
    console.error("[stock] clé non initialisée ou invalide à la capture", orderId);
    return "unavailable";
  } catch (error) {
    console.error("[stock] Redis", error instanceof Error ? error.name : "erreur");
    return "unavailable";
  }
}

export async function restoreCheckoutStock(
  orderId: string,
  lines: StockLine[],
): Promise<"restored" | "skipped" | "unavailable"> {
  const client = getSharedRedis();
  if (!client) return "unavailable";

  const prepared = prepareStockAggregate(lines);
  if (!prepared.ok) return "skipped";

  try {
    const result = (await client.eval(
      RESTORE_LUA,
      [appliedKey(orderId), restoredKey(orderId), ...prepared.agg.map(([key]) => key)],
      prepared.agg.map(([, qty]) => String(qty)),
    )) as number;

    if (result === 1 || result === 2) return "restored";
    if (result === -1) return "skipped";
    return "skipped";
  } catch (error) {
    console.error("[stock] Redis", error instanceof Error ? error.name : "erreur");
    return "unavailable";
  }
}

export async function adjustStock(
  productId: number,
  delta: number,
): Promise<
  | { ok: true; quantity: number }
  | { ok: false; error: string; code: "missing" | "negative" | "unavailable" }
> {
  const client = getSharedRedis();
  if (!client) {
    return { ok: false, error: "Stock indisponible.", code: "unavailable" };
  }

  if (!Number.isInteger(delta)) {
    return { ok: false, error: "Stock indisponible.", code: "unavailable" };
  }

  try {
    const result = (await client.eval(ADJUST_LUA, [stockKey(productId)], [String(delta)])) as number;
    if (result === -1) {
      return { ok: false, error: "Stock non initialisé.", code: "missing" };
    }
    if (result === -2) {
      return { ok: false, error: "Le stock ne peut pas être négatif.", code: "negative" };
    }
    return { ok: true, quantity: result };
  } catch (error) {
    console.error("[stock] Redis", error instanceof Error ? error.name : "erreur");
    return { ok: false, error: "Stock indisponible.", code: "unavailable" };
  }
}

export function alertStockVerification(orderId: string, reason: "short" | "unavailable"): void {
  console.error("[stock] commande à vérifier", { orderId, reason });
}
