import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Redis } from "@upstash/redis";

function stripEnv(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function testCredentials(): { url: string; token: string } | null {
  // REST d’abord : évite un UPSTASH_TEST_* périmé laissé dans le shell (≠ .env.local).
  const url = stripEnv(
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
      process.env.UPSTASH_TEST_URL?.trim() ||
      "",
  );
  const token = stripEnv(
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
      process.env.UPSTASH_TEST_TOKEN?.trim() ||
      "",
  );
  if (!url || !token) return null;
  const prefix = process.env.STOCK_KEY_PREFIX?.trim() ?? "";
  if (!prefix.startsWith("test:")) return null;
  return { url, token };
}

describe("applyCheckoutStock (Lua Upstash)", () => {
  const runId = `lua-${Date.now()}`;
  let client: Redis | undefined;
  let creds: { url: string; token: string } | null = null;

  beforeAll(async () => {
    creds = testCredentials();
    if (!creds) return;
    process.env.STOCK_KEY_PREFIX = "test:";
    process.env.UPSTASH_REDIS_REST_URL = creds.url;
    process.env.UPSTASH_REDIS_REST_TOKEN = creds.token;
    vi.resetModules();
    client = new Redis({ url: creds.url, token: creds.token });
    await client.set("test:connectivity", "1", { ex: 10 });
  });

  afterAll(async () => {
    if (!client) return;
    const keys = await client.keys("test:*");
    if (keys.length > 0) await client.del(...keys);
  });

  it("apply, rejeu code 2, multi-rupture, clé absente", async ({ skip }) => {
    if (!creds || !client) skip();
    const { applyCheckoutStock } = await import("@/lib/stock");

    const orderApply = `${runId}-apply`;
    await client!.set("test:stock:11", "5");
    expect(await applyCheckoutStock(orderApply, [{ productId: 11, qty: 2 }])).toBe("applied");
    expect(await client!.get("test:stock:11")).toBe(3);
    expect(await applyCheckoutStock(orderApply, [{ productId: 11, qty: 2 }])).toBe("applied");
    expect(await client!.get("test:stock:11")).toBe(3);

    const orderShort = `${runId}-short`;
    await client!.set("test:stock:11", "5");
    await client!.set("test:stock:24", "0");
    expect(
      await applyCheckoutStock(orderShort, [
        { productId: 11, qty: 1 },
        { productId: 24, qty: 1 },
      ]),
    ).toBe("short");
    expect(await client!.get("test:stock:11")).toBe(5);
    expect(await client!.get(`test:stock-applied:${orderShort}`)).toBeNull();

    const orderMissing = `${runId}-missing`;
    expect(await applyCheckoutStock(orderMissing, [{ productId: 999, qty: 1 }])).toBe("unavailable");
  });

  it("concurrence : deux apply simultanés, une seule vente", async ({ skip }) => {
    if (!creds || !client) skip();
    const { applyCheckoutStock } = await import("@/lib/stock");
    await client!.set("test:stock:42", "1");
    const orderA = `${runId}-race-a`;
    const orderB = `${runId}-race-b`;
    const lines = [{ productId: 42, qty: 1 }];

    const [r1, r2] = await Promise.all([
      applyCheckoutStock(orderA, lines),
      applyCheckoutStock(orderB, lines),
    ]);

    const outcomes = [r1, r2].sort();
    expect(outcomes).toEqual(["applied", "short"]);
    expect(await client!.get("test:stock:42")).toBe(0);
  });
});
