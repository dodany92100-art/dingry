/**
 * Redis minimal en mémoire pour tests Vitest (set NX, get, mget, eval apply/restore).
 */
type EvalFn = (store: Map<string, string>, keys: string[], args: string[]) => number;

function parseQty(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

const runApplyLua: EvalFn = (store, keys, args) => {
  const appliedKey = keys[0];
  if (store.has(appliedKey)) return 2;
  for (let i = 1; i < keys.length; i += 1) {
    const n = parseQty(store.get(keys[i]));
    if (n === null) return -1;
    if (n < Number(args[i - 1])) return 0;
  }
  for (let i = 1; i < keys.length; i += 1) {
    const n = parseQty(store.get(keys[i])!)!;
    store.set(keys[i], String(n - Number(args[i - 1])));
  }
  store.set(appliedKey, "1");
  return 1;
};

const runRestoreLua: EvalFn = (store, keys, args) => {
  const appliedKey = keys[0];
  const restoredKey = keys[1];
  if (!store.has(appliedKey)) return 0;
  if (store.has(restoredKey)) return 2;
  for (let i = 2; i < keys.length; i += 1) {
    if (!store.has(keys[i])) return -1;
  }
  for (let i = 2; i < keys.length; i += 1) {
    const n = parseQty(store.get(keys[i])!) ?? 0;
    store.set(keys[i], String(n + Number(args[i - 2])));
  }
  store.set(restoredKey, "1");
  return 1;
};

function pickEval(script: string): EvalFn | null {
  if (script.includes('redis.call("decrby"') && script.includes("KEYS[1]")) {
    return runApplyLua;
  }
  if (script.includes('redis.call("incrby"') && script.includes("KEYS[2]")) {
    return runRestoreLua;
  }
  return null;
}

export class MemoryRedis {
  private readonly store = new Map<string, string>();

  async set(key: string, value: string, options?: { nx?: boolean }): Promise<string | null> {
    if (options?.nx && this.store.has(key)) return null;
    this.store.set(key, value);
    return "OK";
  }

  async get<T = string>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return (value ?? null) as T | null;
  }

  async mget<T = string | null>(...keys: string[]): Promise<T[]> {
    return keys.map((key) => (this.store.get(key) ?? null) as T);
  }

  async eval(script: string, keys: string[], args: string[]): Promise<number> {
    const runner = pickEval(script);
    if (!runner) throw new Error("Script Lua non supporté en mémoire");
    return runner(this.store, keys, args);
  }

  snapshot(key: string): string | undefined {
    return this.store.get(key);
  }

  seed(key: string, value: string): void {
    this.store.set(key, value);
  }
}
