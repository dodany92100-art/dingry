import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRedis } from "@/lib/test/memory-redis";
import {
  applyCheckoutStock,
  assertCheckoutStock,
  prepareStockAggregate,
  restoreCheckoutStock,
} from "@/lib/stock";

let memory: MemoryRedis;

vi.mock("@/lib/ratelimit", () => ({
  getSharedRedis: () => memory,
}));

describe("prepareStockAggregate", () => {
  it("refuse une ligne invalide mélangée à des lignes valides", () => {
    expect(
      prepareStockAggregate([
        { productId: 11, qty: 1 },
        { productId: 0, qty: 1 },
      ]),
    ).toEqual({ ok: false });
  });
});

describe("applyCheckoutStock (mémoire, logique Lua apply)", () => {
  beforeEach(() => {
    process.env.STOCK_KEY_PREFIX = "dingry:";
    memory = new MemoryRedis();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("panier avec ligne invalide : short, aucun décrément", async () => {
    memory.seed("dingry:stock:11", "5");
    const result = await applyCheckoutStock("order-invalid", [
      { productId: 11, qty: 1 },
      { productId: -1, qty: 1 },
    ]);
    expect(result).toBe("short");
    expect(memory.snapshot("dingry:stock:11")).toBe("5");
  });

  it("valeur non numérique en Redis : unavailable", async () => {
    memory.seed("dingry:stock:11", "oops");
    expect(await applyCheckoutStock("order-bad", [{ productId: 11, qty: 1 }])).toBe("unavailable");
    expect(memory.snapshot("dingry:stock:11")).toBe("oops");
  });

  it("double apply : un seul décrément", async () => {
    memory.seed("dingry:stock:11", "5");
    const lines = [{ productId: 11, qty: 1 }];
    expect(await applyCheckoutStock("order-a", lines)).toBe("applied");
    expect(await applyCheckoutStock("order-a", lines)).toBe("applied");
    expect(memory.snapshot("dingry:stock:11")).toBe("4");
  });

  it("rupture panier multi-articles : aucun décrément", async () => {
    memory.seed("dingry:stock:11", "5");
    memory.seed("dingry:stock:24", "0");
    expect(
      await applyCheckoutStock("order-b", [
        { productId: 11, qty: 1 },
        { productId: 24, qty: 1 },
      ]),
    ).toBe("short");
    expect(memory.snapshot("dingry:stock:11")).toBe("5");
  });

  it("clé stock absente : unavailable", async () => {
    expect(await applyCheckoutStock("order-c", [{ productId: 99, qty: 1 }])).toBe("unavailable");
  });
});

describe("restoreCheckoutStock", () => {
  beforeEach(() => {
    process.env.STOCK_KEY_PREFIX = "dingry:";
    memory = new MemoryRedis();
  });

  it("ne crée pas de stock si la clé produit est absente", async () => {
    memory.seed("dingry:stock-applied:order-r", "1");
    const result = await restoreCheckoutStock("order-r", [{ productId: 77, qty: 2 }]);
    expect(result).toBe("skipped");
    expect(memory.snapshot("dingry:stock:77")).toBeUndefined();
  });
});

describe("assertCheckoutStock", () => {
  beforeEach(() => {
    process.env.STOCK_KEY_PREFIX = "dingry:";
    memory = new MemoryRedis();
  });

  it("503 si valeur Redis non numérique", async () => {
    memory.seed("dingry:stock:11", "NaN-ish");
    const result = await assertCheckoutStock([{ productId: 11, qty: 1 }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });
});
