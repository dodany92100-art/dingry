import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readMock = vi.hoisted(() => vi.fn());
const writeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ratelimit", () => ({
  getSharedRedis: () => null,
}));

vi.mock("@/lib/admin/store-snapshot-file", () => ({
  readFileStoreSnapshot: (...args: unknown[]) => readMock(...args),
  writeFileStoreSnapshot: (...args: unknown[]) => writeMock(...args),
  adminStoreSnapshotPath: () => "/tmp/dingry-test-store.json",
  revisionFromDiskText: (text: string) => text,
}));

function order(id: string) {
  return {
    id,
    customerName: "Client",
    email: "c@test.fr",
    total: 42,
    items: ["Article"],
    status: "En attente" as const,
    createdAt: new Date().toISOString(),
    source: "paypal" as const,
  };
}

function storeSnapshot(orders: ReturnType<typeof order>[], etag: string) {
  return {
    store: {
      version: 13,
      products: [],
      orders,
      lookbook: [],
      removedCatalogIds: [],
    },
    etag,
  };
}

describe("withStoreOptimistic concurrence fichier (prod)", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xxx.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    writeMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    readMock.mockReset();
    writeMock.mockReset();
    vi.useRealTimers();
  });

  it(
    "deux patchOrder en parallèle : file sérialisée, deux écritures",
    async () => {
      readMock.mockImplementation(async () => storeSnapshot([order("ORD-1"), order("ORD-2")], "etag-shared"));

      const { patchOrder } = await import("@/lib/admin/store");
      await Promise.all([
        patchOrder("ORD-1", () => ({ status: "Expédié" })),
        patchOrder("ORD-2", () => ({ status: "Expédié" })),
      ]);

      expect(writeMock).toHaveBeenCalledTimes(2);
    },
    20_000,
  );

  it(
    "conflit etag puis relecture : succès au retry",
    async () => {
    const { patchOrder, StoreConflictError } = await import("@/lib/admin/store");
    const body = storeSnapshot([order("ORD-1")], "etag-v1");
    let reads = 0;
    readMock.mockImplementation(async () => {
      reads += 1;
      if (reads === 1) return body;
      return storeSnapshot([order("ORD-1")], "etag-v2");
    });
    writeMock.mockRejectedValueOnce(new StoreConflictError()).mockResolvedValueOnce(undefined);

    await expect(patchOrder("ORD-1", () => ({ status: "Expédié" }))).resolves.toEqual(
      expect.objectContaining({ changed: true }),
    );
    expect(writeMock).toHaveBeenCalledTimes(2);
    },
    20_000,
  );

  it("conflits répétés → StoreConflictError", async () => {
    const { patchOrder, StoreConflictError } = await import("@/lib/admin/store");
    readMock.mockImplementation(async () => storeSnapshot([order("ORD-1")], "etag-stuck"));
    writeMock.mockRejectedValue(new StoreConflictError());

    await expect(patchOrder("ORD-1", () => ({ status: "Expédié" }))).rejects.toBeInstanceOf(StoreConflictError);
    expect(writeMock.mock.calls.length).toBeGreaterThanOrEqual(8);
  }, 20_000);
});
