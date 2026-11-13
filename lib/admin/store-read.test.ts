import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ratelimit", () => ({
  getSharedRedis: () => null,
}));

vi.mock("@/lib/admin/store-snapshot-file", () => ({
  readFileStoreSnapshot: (...args: unknown[]) => readMock(...args),
  writeFileStoreSnapshot: vi.fn(),
  adminStoreSnapshotPath: () => "/tmp/dingry-test-store.json",
  revisionFromDiskText: (text: string) => text,
}));

describe("readFileStoreSnapshot via withStoreOptimistic", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xxx.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    readMock.mockReset();
  });

  it(
    "get en échec ne déclenche aucune écriture",
    async () => {
      readMock.mockRejectedValue(new Error("network timeout"));
      const { insertOrderIfNew, StoreUnavailableError } = await import("@/lib/admin/store");
      await expect(
        insertOrderIfNew({
          id: "TEST-ORDER",
          customerName: "Test",
          email: "t@test.fr",
          total: 35,
          items: ["Tee"],
          status: "Payée",
          createdAt: new Date().toISOString(),
          source: "paypal",
        }),
      ).rejects.toBeInstanceOf(StoreUnavailableError);
    },
    20_000,
  );
});

