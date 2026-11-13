import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readMock = vi.hoisted(() => vi.fn());
const writeMock = vi.hoisted(() => vi.fn());
const redisSet = vi.hoisted(() => vi.fn());
const redisEval = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin/store-snapshot-file", () => ({
  readFileStoreSnapshot: (...args: unknown[]) => readMock(...args),
  writeFileStoreSnapshot: (...args: unknown[]) => writeMock(...args),
  adminStoreSnapshotPath: () => "/tmp/dingry-test-store.json",
  revisionFromDiskText: (text: string) => text,
}));

vi.mock("@/lib/ratelimit", () => ({
  getSharedRedis: () => ({
    set: redisSet,
    eval: redisEval,
  }),
}));

function order() {
  return {
    id: "ORD-1",
    customerName: "A",
    email: "a@b.fr",
    total: 10,
    items: [],
    status: "Payée" as const,
    createdAt: new Date().toISOString(),
    source: "paypal" as const,
  };
}

describe("verrou Redis store", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xxx.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    redisSet.mockResolvedValue("OK");
    redisEval.mockResolvedValue(1);
    writeMock.mockResolvedValue(undefined);
    readMock.mockResolvedValue({
      store: {
        version: 13,
        products: [],
        orders: [order()],
        lookbook: [],
        removedCatalogIds: [],
      },
      etag: "etag-1",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    readMock.mockReset();
    writeMock.mockReset();
    redisSet.mockReset();
    redisEval.mockReset();
  });

  it(
    "prend et libère dingry:store-lock autour de l’écriture",
    async () => {
      const { patchOrder } = await import("@/lib/admin/store");
      await patchOrder("ORD-1", () => ({ status: "Expédiée" }));
      expect(redisSet).toHaveBeenCalledWith(
        "dingry:store-lock",
        expect.any(String),
        expect.objectContaining({ nx: true, ex: 20 }),
      );
      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(redisEval).toHaveBeenCalled();
    },
    20_000,
  );

  it(
    "StoreConflictError si le lock n'est jamais acquis",
    async () => {
      redisSet.mockResolvedValue(null);
      const { patchOrder, StoreConflictError } = await import("@/lib/admin/store");
      await expect(patchOrder("ORD-1", () => ({ status: "Expédiée" }))).rejects.toBeInstanceOf(
        StoreConflictError,
      );
      expect(writeMock).not.toHaveBeenCalled();
    },
    20_000,
  );
});
